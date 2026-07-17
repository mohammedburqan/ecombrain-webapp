"use client";

import { useTranslations } from "next-intl";
import { StepCard } from "./StepCard";
import {
  ValidationForkBanner,
  type ValidationVerdict,
} from "./ValidationForkBanner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { countApproved } from "@/lib/pipeline/steps";
import type { StepWithProgress } from "@/types/database";

export function PipelineView({
  steps,
  verdict = null,
}: {
  steps: StepWithProgress[];
  verdict?: ValidationVerdict | null;
}) {
  const t = useTranslations("pipeline");
  const tb = useTranslations("brands");
  const done = countApproved(steps.map((s) => s.progress.status));
  const total = steps.length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">{t("title")}</h2>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink-muted">
          {tb("stepsComplete", { done, total })}
        </span>
      </div>

      <ProgressBar value={pct} />

      {verdict ? <ValidationForkBanner verdict={verdict} /> : null}

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.id}>
            <StepCard step={step} />
          </li>
        ))}
      </ol>
    </section>
  );
}
