"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIcon } from "./StepIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { countApproved, getRoadmapPhase } from "@/lib/pipeline/steps";
import { TOTAL_STEPS } from "@/lib/pipeline/steps";
import type { StepWithProgress } from "@/types/database";
import type { StepStatus } from "@/types/database";

// ---- Status helpers --------------------------------------------------------

const STATUS_RING: Record<StepStatus, string> = {
  locked: "border-line bg-canvas text-ink-muted",
  unlocked: "border-brand-accent bg-brand-purple/10 text-brand-accent animate-pulse",
  in_progress: "border-brand-accent bg-brand-purple/10 text-brand-accent",
  submitted: "border-amber-400 bg-amber-50 text-amber-600",
  approved: "border-green-500 bg-green-50 text-green-600",
  failed: "border-red-400 bg-red-50 text-red-600",
};

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "locked") return <Lock className="size-3.5 text-ink-muted" />;
  if (status === "approved") return <CheckCircle2 className="size-3.5 text-green-600" />;
  if (status === "failed") return <AlertCircle className="size-3.5 text-red-500" />;
  if (status === "submitted") return <Clock className="size-3.5 text-amber-500" />;
  return null;
}

// ---- Individual step node --------------------------------------------------

function StepNode({
  step,
  brandId,
  compact = false,
}: {
  step: StepWithProgress;
  brandId: string;
  compact?: boolean;
}) {
  const t = useTranslations("pipeline");
  const locale = useLocale();
  const status = step.progress.status;
  const locked = status === "locked";
  const name = locale === "ar" ? step.name_ar : step.name_en;
  const href = locked ? undefined : `/dashboard/brands/${brandId}/steps/${step.id}`;

  const node = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        locked
          ? "border-line bg-surface opacity-60"
          : "border-line bg-surface hover:border-brand-accent/50 hover:bg-canvas cursor-pointer",
        compact && "py-2.5",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl border-2",
          compact ? "size-9" : "size-10",
          STATUS_RING[status],
        )}
      >
        <StepIcon stepKey={step.step_key} className={compact ? "size-4" : "size-5"} />
        {status !== "unlocked" && status !== "in_progress" ? (
          <span className="absolute -bottom-1 -end-1 rounded-full border border-line bg-surface p-0.5">
            <StatusIcon status={status} />
          </span>
        ) : null}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-ink-muted">
          {t("stepLabel", { number: step.sort_order })}
        </p>
        <p
          className={cn(
            "truncate font-semibold",
            compact ? "text-sm" : "text-sm",
            locked ? "text-ink-muted" : "text-ink",
          )}
        >
          {name}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-xl">
      {node}
    </Link>
  ) : (
    <div>{node}</div>
  );
}

// ---- Connector line --------------------------------------------------------

function Connector({ double = false }: { double?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center", double ? "gap-8" : "")}>
      {double ? (
        <>
          <div className="h-6 w-px bg-line" />
          <div className="h-6 w-px bg-line" />
        </>
      ) : (
        <div className="h-6 w-px bg-line" />
      )}
    </div>
  );
}

// ---- Main RoadmapView component --------------------------------------------

interface RoadmapViewProps {
  steps: StepWithProgress[];
  brandId: string;
}

export function RoadmapView({ steps, brandId }: RoadmapViewProps) {
  const t = useTranslations("pipeline");
  const approved = countApproved(steps.map((s) => s.progress.status));

  // Group steps by phase.
  const linear = steps.filter((s) => getRoadmapPhase(s.sort_order) === "linear");
  const parallel = steps.filter((s) => getRoadmapPhase(s.sort_order) === "parallel");
  const converge = steps.find((s) => getRoadmapPhase(s.sort_order) === "converge");
  const final = steps.filter((s) => getRoadmapPhase(s.sort_order) === "final");

  // Parallel section: main track (9, 10) + side branches (11, 14)
  const mainParallel = parallel.filter((s) => s.sort_order === 9 || s.sort_order === 10);
  const sideBranches = parallel.filter((s) => s.sort_order === 11 || s.sort_order === 14);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">
            {t("roadmapTitle")}
          </span>
          <span className="text-ink-muted">
            {approved} / {TOTAL_STEPS}
          </span>
        </div>
        <ProgressBar value={Math.round((approved / TOTAL_STEPS) * 100)} />
      </div>

      {/* Phase A: Linear steps 1-8 */}
      <div className="space-y-1.5">
        {linear.map((step, i) => (
          <div key={step.id}>
            <StepNode step={step} brandId={brandId} />
            {i < linear.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      {/* Diverge into parallel tracks */}
      {parallel.length > 0 && (
        <>
          <Connector double />

          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t("parallelBranch")}
            </p>
            {/* Grid: main track (steps 9→10) | side branches (11, 14) */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Main track column */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted/70">
                  {t("mainTrack")}
                </p>
                {mainParallel.map((step, i) => (
                  <div key={step.id}>
                    <StepNode step={step} brandId={brandId} compact />
                    {i < mainParallel.length - 1 && <Connector />}
                  </div>
                ))}
              </div>

              {/* Side branches column */}
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted/70">
                  {t("parallelBranch")}
                </p>
                {sideBranches.map((step) => (
                  <StepNode key={step.id} step={step} brandId={brandId} compact />
                ))}
              </div>
            </div>
          </div>

          {/* AND-gate indicator */}
          {converge && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 border-t border-dashed border-line" />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-medium text-ink-muted">
                  <GitMerge className="size-3.5" />
                  {t("andGate")}
                </span>
                <div className="h-px flex-1 border-t border-dashed border-line" />
              </div>
              <StepNode step={converge} brandId={brandId} />
            </>
          )}
        </>
      )}

      {/* Phase D: Final repeatable steps (13, 15) */}
      {final.length > 0 && (
        <>
          <Connector double={final.length > 1} />
          <div className="grid gap-3 sm:grid-cols-2">
            {final.map((step) => (
              <StepNode key={step.id} step={step} brandId={brandId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
