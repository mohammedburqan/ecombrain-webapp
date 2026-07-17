import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOTAL_STEPS } from "@/lib/pipeline/steps";
import type {
  Brand,
  BrandStepProgress,
  PipelineStep,
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
