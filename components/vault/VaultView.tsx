"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSignedUrlAction } from "@/lib/pipeline/actions";
import type { VaultGroup } from "@/lib/brands/queries";
import type { StepFile } from "@/types/database";

function VersionRow({
  file,
  brandId,
}: {
  file: StepFile;
  brandId: string;
}) {
  const t = useTranslations("vault");
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const { url, error } = await getSignedUrlAction(file.storage_path, brandId);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.original_filename ?? "download";
        a.click();
      } else {
        console.error("Download error:", error);
        alert(t("downloadError"));
      }
    });
  }

  const date = new Date(file.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="size-4 shrink-0 text-ink-muted" />
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">
            {file.original_filename ?? "file"}
          </p>
          <p className="text-xs text-ink-muted">
            {t("version", { v: file.version })} · {t("uploadedAt", { date })}
          </p>
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={isPending}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
      >
        <Download className="size-3.5" />
        {isPending ? "…" : t("download")}
      </button>
    </div>
  );
}

function StepGroup({
  group,
  brandId,
}: {
  group: VaultGroup;
  brandId: string;
}) {
  const locale = useLocale();
  const t = useTranslations("pipeline");
  const [open, setOpen] = useState(true);

  const stepName =
    locale === "ar" ? group.stepNameAr : group.stepNameEn;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start hover:bg-canvas"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-brand-purple/10 px-2.5 py-1 text-xs font-semibold text-brand-accent">
            {t("stepLabel", { number: group.stepSortOrder })}
          </span>
          <span className="font-semibold text-ink">{stepName}</span>
          <span className="text-sm text-ink-muted">
            ({group.files.length})
          </span>
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-ink-muted" />
        )}
      </button>
      {open && (
        <div className="divide-y divide-line border-t border-line px-5">
          {group.files.map((f) => (
            <VersionRow key={f.id} file={f} brandId={brandId} />
          ))}
        </div>
      )}
    </div>
  );
}

interface VaultViewProps {
  groups: VaultGroup[];
  brandId: string;
}

export function VaultView({ groups, brandId }: VaultViewProps) {
  const t = useTranslations("vault");

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-7" />}
        title={t("noFiles")}
        description={t("noFilesHint")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <StepGroup key={group.stepId} group={group} brandId={brandId} />
      ))}
    </div>
  );
}
