"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { CHECKBOX_STEP_KEYS } from "@/lib/pipeline/steps";

const MAX_FILE_SIZE = 52_428_800; // 50 MB

export interface SubmitStepResult {
  ok: boolean;
  error?: string;
}

// Returns the non-'checkbox' output types for a step (the actual file types).
function fileTypesFor(outputFileTypes: string[]): string[] {
  return outputFileTypes.filter((t) => t !== "checkbox");
}

// Validates file extension against allowed types.
function isAllowedType(filename: string, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return allowedTypes.includes(ext);
}

export async function submitStepAction(
  formData: FormData,
): Promise<SubmitStepResult> {
  const user = await requireAuth();

  const brandId = formData.get("brandId") as string | null;
  const stepIdRaw = formData.get("stepId") as string | null;
  const file = formData.get("file") as File | null;
  const confirmed = formData.get("confirmed") === "true";

  if (!brandId || !stepIdRaw) {
    return { ok: false, error: "missing_params" };
  }

  const stepId = parseInt(stepIdRaw, 10);
  if (isNaN(stepId)) return { ok: false, error: "invalid_step" };

  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  // Fetch step metadata.
  const { data: step } = await supabase
    .from("pipeline_steps")
    .select("step_key, output_file_types, sort_order, is_repeatable")
    .eq("id", stepId)
    .single();

  if (!step) return { ok: false, error: "step_not_found" };

  // Verify the step is accessible for this brand.
  const { data: progress } = await supabase
    .from("brand_step_progress")
    .select("status")
    .eq("brand_id", brandId)
    .eq("step_id", stepId)
    .single();

  if (!progress || progress.status === "locked") {
    return { ok: false, error: "step_locked" };
  }

  const isCheckboxStep = CHECKBOX_STEP_KEYS.has(step.step_key);
  const allowedFileTypes = fileTypesFor(step.output_file_types as string[]);

  // For checkbox steps: confirmed must be true (file is optional).
  // For file steps: a file is required.
  if (!isCheckboxStep && !file) {
    return { ok: false, error: "file_required" };
  }
  if (isCheckboxStep && !confirmed && !file) {
    return { ok: false, error: "confirm_required" };
  }

  // Handle file upload if provided.
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: "file_too_large" };
    if (!isAllowedType(file.name, allowedFileTypes)) {
      return { ok: false, error: "wrong_file_type" };
    }

    // Determine next version number.
    const { data: existing } = await serviceRole
      .from("step_files")
      .select("version")
      .eq("brand_id", brandId)
      .eq("step_id", stepId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existing?.version ?? 0) + 1;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `brands/${brandId}/step_${step.sort_order}/v${nextVersion}_${safeName}`;

    const bytes = await file.arrayBuffer();
    const { error: storageError } = await serviceRole.storage
      .from("brand-files")
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return { ok: false, error: "upload_failed" };
    }

    // Insert the step_files row (immutable — no UPDATE/DELETE allowed by RLS).
    const { error: dbError } = await serviceRole.from("step_files").insert({
      brand_id: brandId,
      step_id: stepId,
      uploaded_by: user.id,
      storage_path: storagePath,
      original_filename: file.name,
      version: nextVersion,
      parse_status: "not_applicable",
    });

    if (dbError) {
      console.error("step_files insert error:", dbError);
      return { ok: false, error: "db_error" };
    }
  }

  // Advance the pipeline (approve step + unlock next steps).
  // advance_pipeline handles: already-approved non-repeatable steps (no-op),
  // repeatable steps (re-approve), AND-gate for step 12.
  const { data: rpcResult, error: rpcError } = await serviceRole.rpc(
    "advance_pipeline",
    { p_brand_id: brandId, p_step_id: stepId },
  );

  if (rpcError) {
    console.error("advance_pipeline error:", rpcError);
    return { ok: false, error: "advance_failed" };
  }

  if (!(rpcResult as { ok: boolean }).ok) {
    const err = (rpcResult as { error?: string }).error;
    if (err === "step_locked") return { ok: false, error: "step_locked" };
    // Other errors (already_approved non-repeatable) are acceptable.
  }

  revalidatePath(`/dashboard/brands/${brandId}`);
  revalidatePath(`/dashboard/brands/${brandId}/steps/${stepId}`);
  revalidatePath(`/dashboard/brands/${brandId}/vault`);

  return { ok: true };
}

// Generate a short-lived signed download URL for a stored file.
export async function getSignedUrlAction(
  storagePath: string,
  brandId: string,
): Promise<{ url: string | null; error?: string }> {
  await requireAuth();

  // Verify the caller can see this brand.
  const supabase = await createSupabaseServerClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand) return { url: null, error: "brand_not_found" };

  const serviceRole = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRole.storage
    .from("brand-files")
    .createSignedUrl(storagePath, 3600); // 1-hour expiry

  if (error || !data?.signedUrl) {
    return { url: null, error: "signed_url_failed" };
  }

  return { url: data.signedUrl };
}
