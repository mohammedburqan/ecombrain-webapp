// Domain types mirroring the EcomSkool Companion App Postgres schema
// (see supabase/migrations/0001_ecomskool_init.sql).

export type UserRole = "student" | "admin";

export type BrandStatus = "active" | "killed" | "launched";

export type StepStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "submitted"
  | "approved"
  | "failed";

export type ParseStatus = "pending" | "parsed" | "parse_failed" | "not_applicable";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  community_member_id: string | null;
  created_at: string;
}

export interface Brand {
  id: string;
  owner_id: string;
  name: string;
  product_name: string;
  target_market: string | null;
  status: BrandStatus;
  created_at: string;
}

export interface PipelineStep {
  id: number;
  step_key: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  output_file_types: string[];
  sort_order: number;
  is_repeatable: boolean;
  prompt_template: string | null;
  video_url: string | null;
  required_mcps: string[];
}

export interface BrandStepProgress {
  id: string;
  brand_id: string;
  step_id: number;
  status: StepStatus;
  unlocked_at: string | null;
  completed_at: string | null;
}

export interface StepFile {
  id: string;
  brand_id: string;
  step_id: number;
  uploaded_by: string | null;
  storage_path: string;
  original_filename: string | null;
  version: number;
  parse_status: ParseStatus;
  parsed_data: Record<string, unknown> | null;
  created_at: string;
}

// A pipeline step joined with a brand's progress on it — the shape the
// pipeline UI renders.
export interface StepWithProgress extends PipelineStep {
  progress: Pick<BrandStepProgress, "status" | "unlocked_at" | "completed_at">;
}
