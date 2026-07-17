"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { STEP_STATUS_I18N } from "@/lib/pipeline/steps";
import type { StepStatus } from "@/types/database";

const TONES: Record<StepStatus, BadgeTone> = {
  locked: "neutral",
  unlocked: "brand",
  in_progress: "blue",
  submitted: "amber",
  approved: "green",
  failed: "red",
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
  const t = useTranslations("pipeline");
  return <Badge tone={TONES[status]}>{t(STEP_STATUS_I18N[status])}</Badge>;
}
