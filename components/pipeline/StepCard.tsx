"use client";

import { useLocale, useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { StepIcon } from "./StepIcon";
import { StepStatusBadge } from "./StepStatusBadge";
import { cn } from "@/lib/utils";
import type { StepWithProgress } from "@/types/database";

export function StepCard({ step }: { step: StepWithProgress }) {
  const locale = useLocale();
  const t = useTranslations("pipeline");
  const name = locale === "ar" ? step.name_ar : step.name_en;
  const status = step.progress.status;
  const locked = status === "locked";

  const hint =
    status === "locked"
      ? t("lockedHint")
      : status === "unlocked"
        ? t("startHint")
        : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 sm:p-5",
        locked && "opacity-70",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-xl",
            locked
              ? "bg-canvas text-ink-muted"
              : "bg-brand-purple/10 text-brand-accent",
          )}
        >
          <StepIcon stepKey={step.step_key} className="size-5" />
          {locked ? (
            <span className="absolute -bottom-1 -end-1 rounded-full border border-line bg-surface p-0.5">
              <Lock className="size-3 text-ink-muted" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-muted">
                {t("stepLabel", { number: step.sort_order })}
              </p>
              <h3 className="truncate font-bold text-ink">{name}</h3>
            </div>
            <StepStatusBadge status={status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-muted">{t("outputTypes")}:</span>
            {step.output_file_types.map((ft) => (
              <code
                key={ft}
                dir="ltr"
                className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-muted"
              >
                {ft}
              </code>
            ))}
            {step.is_repeatable ? (
              <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] font-medium text-brand-accent">
                {t("repeatable")}
              </span>
            ) : null}
          </div>

          {hint ? <p className="mt-2 text-sm text-ink-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
