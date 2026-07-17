import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { TOTAL_STEPS, STEP_REQUIRED_INPUTS } from "@/lib/pipeline/steps";
import type {
  Brand,
  BrandStepProgress,
  PipelineStep,
  StepFile,
  StepWithProgress,
} from "@/types/database";

export interface BrandWithProgress extends Brand {
  approvedCount: number;
  totalSteps: number;
}

// All brands the current user can see (RLS: own brands for students, all for
// admins), newest first.
export async function listBrands(): Promise<Brand[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Brand[];
}

// Brands plus how many steps are approved, for cards / dashboards.
export async function listBrandsWithProgress(): Promise<BrandWithProgress[]> {
  const supabase = await createSupabaseServerClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (brands ?? []) as Brand[];
  if (list.length === 0) return [];

  const { data: progress } = await supabase
    .from("brand_step_progress")
    .select("brand_id,status")
    .in(
      "brand_id",
      list.map((b) => b.id),
    );

  const approved = new Map<string, number>();
  for (const row of (progress ?? []) as Pick<
    BrandStepProgress,
    "brand_id" | "status"
  >[]) {
    if (row.status === "approved") {
      approved.set(row.brand_id, (approved.get(row.brand_id) ?? 0) + 1);
    }
  }

  return list.map((b) => ({
    ...b,
    approvedCount: approved.get(b.id) ?? 0,
    totalSteps: TOTAL_STEPS,
  }));
}

export interface BrandWorkspace {
  brand: Brand;
  steps: StepWithProgress[];
}

// A single brand with its full 15-step pipeline (steps joined with progress),
// ordered by sort_order. Returns null if the brand isn't visible to the user.
export async function getBrandWorkspace(
  brandId: string,
): Promise<BrandWorkspace | null> {
  const supabase = await createSupabaseServerClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand) return null;

  const [{ data: stepRows }, { data: progressRows }] = await Promise.all([
    supabase.from("pipeline_steps").select("*").order("sort_order"),
    supabase
      .from("brand_step_progress")
      .select("*")
      .eq("brand_id", brandId),
  ]);

  const progressByStep = new Map<number, BrandStepProgress>();
  for (const p of (progressRows ?? []) as BrandStepProgress[]) {
    progressByStep.set(p.step_id, p);
  }

  const steps: StepWithProgress[] = ((stepRows ?? []) as PipelineStep[]).map(
    (step) => {
      const p = progressByStep.get(step.id);
      return {
        ...step,
        progress: {
          status: p?.status ?? "locked",
          unlocked_at: p?.unlocked_at ?? null,
          completed_at: p?.completed_at ?? null,
        },
      };
    },
  );

  return { brand: brand as Brand, steps };
}

// -------------------------------------------------------------------------
// Step-detail context: one step with progress + prerequisite files from vault
// -------------------------------------------------------------------------
export interface StepDetailContext {
  brand: Brand;
  step: StepWithProgress;
  prerequisiteFiles: (StepFile & { step_sort_order: number; step_name_ar: string; step_name_en: string })[];
}

export async function getStepWithContext(
  brandId: string,
  stepId: number,
): Promise<StepDetailContext | null> {
  const supabase = await createSupabaseServerClient();

  const [{ data: brand }, { data: stepRow }, { data: progressRow }] =
    await Promise.all([
      supabase.from("brands").select("*").eq("id", brandId).maybeSingle(),
      supabase.from("pipeline_steps").select("*").eq("id", stepId).maybeSingle(),
      supabase
        .from("brand_step_progress")
        .select("*")
        .eq("brand_id", brandId)
        .eq("step_id", stepId)
        .maybeSingle(),
    ]);

  if (!brand || !stepRow) return null;

  const step: StepWithProgress = {
    ...(stepRow as PipelineStep & { description_en?: string }),
    progress: {
      status: (progressRow as BrandStepProgress | null)?.status ?? "locked",
      unlocked_at: (progressRow as BrandStepProgress | null)?.unlocked_at ?? null,
      completed_at: (progressRow as BrandStepProgress | null)?.completed_at ?? null,
    },
  };

  // Fetch approved files from prerequisite steps.
  const prereqStepIds = STEP_REQUIRED_INPUTS[(stepRow as PipelineStep).step_key] ?? [];
  let prerequisiteFiles: StepDetailContext["prerequisiteFiles"] = [];

  if (prereqStepIds.length > 0) {
    // Get the latest version of each prerequisite step's approved files.
    const { data: prereqSteps } = await supabase
      .from("pipeline_steps")
      .select("id, sort_order, name_ar, name_en")
      .in("id", prereqStepIds);

    const { data: files } = await supabase
      .from("step_files")
      .select("*")
      .eq("brand_id", brandId)
      .in("step_id", prereqStepIds)
      .order("version", { ascending: false });

    // Keep only the latest version per step.
    const seen = new Set<number>();
    for (const f of (files ?? []) as StepFile[]) {
      if (!seen.has(f.step_id)) {
        seen.add(f.step_id);
        const ps = (prereqSteps ?? []).find((s) => s.id === f.step_id);
        if (ps) {
          prerequisiteFiles.push({
            ...f,
            step_sort_order: ps.sort_order,
            step_name_ar: ps.name_ar,
            step_name_en: ps.name_en,
          });
        }
      }
    }
  }

  return { brand: brand as Brand, step, prerequisiteFiles };
}

// -------------------------------------------------------------------------
// Vault: all uploaded files for a brand, grouped by step
// -------------------------------------------------------------------------
export interface VaultFile extends StepFile {
  step_name_ar: string;
  step_name_en: string;
  step_sort_order: number;
}

export interface VaultGroup {
  stepId: number;
  stepSortOrder: number;
  stepNameAr: string;
  stepNameEn: string;
  files: StepFile[];
}

export async function getVaultFiles(brandId: string): Promise<VaultGroup[]> {
  const supabase = await createSupabaseServerClient();

  // RLS check: can the current user see this brand?
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand) return [];

  const [{ data: files }, { data: steps }] = await Promise.all([
    supabase
      .from("step_files")
      .select("*")
      .eq("brand_id", brandId)
      .order("step_id")
      .order("version", { ascending: false }),
    supabase
      .from("pipeline_steps")
      .select("id, sort_order, name_ar, name_en")
      .order("sort_order"),
  ]);

  const stepMap = new Map<number, { sort_order: number; name_ar: string; name_en: string }>();
  for (const s of (steps ?? [])) {
    stepMap.set(s.id, { sort_order: s.sort_order, name_ar: s.name_ar, name_en: s.name_en });
  }

  const groups = new Map<number, VaultGroup>();
  for (const f of (files ?? []) as StepFile[]) {
    const ps = stepMap.get(f.step_id);
    if (!ps) continue;
    if (!groups.has(f.step_id)) {
      groups.set(f.step_id, {
        stepId: f.step_id,
        stepSortOrder: ps.sort_order,
        stepNameAr: ps.name_ar,
        stepNameEn: ps.name_en,
        files: [],
      });
    }
    groups.get(f.step_id)!.files.push(f);
  }

  return Array.from(groups.values()).sort((a, b) => a.stepSortOrder - b.stepSortOrder);
}

// Generate a signed download URL for a vault file (server-side, service role).
export async function getSignedDownloadUrl(
  storagePath: string,
  brandId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .maybeSingle();
  if (!brand) return null;

  const serviceRole = createSupabaseServiceRoleClient();
  const { data } = await serviceRole.storage
    .from("brand-files")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? null;
}
