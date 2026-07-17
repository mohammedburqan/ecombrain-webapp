import type { StepStatus } from "@/types/database";

// The pipeline has 15 ordered steps. The master definition (names, output
// types, repeatability) lives in the DB (public.pipeline_steps) so admins can
// edit it. This module holds only the static, code-level metadata the UI needs
// that isn't worth a DB round-trip: an icon per step and which track it's on.

export const TOTAL_STEPS = 15;

// Step 3 is the "validation fork": its uploaded workbook carries a verdict that
// decides whether the rest of the pipeline unlocks.
export const VALIDATION_STEP_KEY = "validation";

export type PipelineTrack = "main" | "parallel";

export interface StepMeta {
  /** lucide-react icon name, resolved to a component in the UI layer. */
  icon: string;
  track: PipelineTrack;
}

// Keyed by step_key (stable identifier that never changes even if admins
// rename a step).
export const STEP_META: Record<string, StepMeta> = {
  product_research: { icon: "Search", track: "main" },
  competitor_research: { icon: "Swords", track: "main" },
  validation: { icon: "ClipboardCheck", track: "main" },
  language_bank: { icon: "MessagesSquare", track: "main" },
  offer_creation: { icon: "Gift", track: "main" },
  unit_economics: { icon: "Calculator", track: "main" },
  creative_strategy: { icon: "Lightbulb", track: "main" },
  branding_kit: { icon: "Palette", track: "main" },
  ad_scripts: { icon: "PenLine", track: "main" },
  creative_production: { icon: "Clapperboard", track: "main" },
  pdp: { icon: "LayoutTemplate", track: "parallel" },
  meta_campaign: { icon: "Megaphone", track: "main" },
  campaign_analysis: { icon: "TrendingUp", track: "main" },
  seo: { icon: "Globe", track: "parallel" },
  pl_workbook: { icon: "Wallet", track: "main" },
};

export const DEFAULT_STEP_META: StepMeta = { icon: "Circle", track: "main" };

// Maps a step status to its i18n message key under the `pipeline` namespace.
export const STEP_STATUS_I18N: Record<StepStatus, string> = {
  locked: "statusLocked",
  unlocked: "statusUnlocked",
  in_progress: "statusInProgress",
  submitted: "statusSubmitted",
  approved: "statusApproved",
  failed: "statusFailed",
};

// A step counts as "done" for progress purposes when it's approved.
export function isStepDone(status: StepStatus): boolean {
  return status === "approved";
}

export function countApproved(statuses: StepStatus[]): number {
  return statuses.filter(isStepDone).length;
}

// Steps that use a checkbox confirmation (file upload is optional for these).
// Maps to step_keys that have 'checkbox' in their output_file_types.
export const CHECKBOX_STEP_KEYS = new Set(["pdp", "meta_campaign", "seo"]);

// Per-step prerequisite step IDs (sort_order == id) whose approved files
// should be shown as downloadable inputs on the step detail page.
export const STEP_REQUIRED_INPUTS: Record<string, number[]> = {
  offer_creation: [2, 3],
  unit_economics: [5],
  creative_strategy: [4, 5, 6],
  branding_kit: [4, 5],
  ad_scripts: [7, 8],
  creative_production: [9],
  pdp: [5, 8],
  meta_campaign: [10, 11],
  campaign_analysis: [12],
  seo: [5, 8],
  pl_workbook: [6],
};

// Visual grouping for the roadmap. Returns the "phase" label for a step.
export type RoadmapPhase =
  | "linear"       // steps 1-8
  | "parallel"     // steps 9-11 and 14 (unlock together from step 8)
  | "converge"     // step 12 (AND gate: needs 10 + 11)
  | "final";       // steps 13 and 15

export function getRoadmapPhase(sortOrder: number): RoadmapPhase {
  if (sortOrder <= 8) return "linear";
  if (sortOrder === 12) return "converge";
  if (sortOrder === 13 || sortOrder === 15) return "final";
  return "parallel"; // 9, 10, 11, 14
}
