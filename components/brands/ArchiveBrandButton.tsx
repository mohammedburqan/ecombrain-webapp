"use client";

import { useTranslations } from "next-intl";
import { Archive } from "lucide-react";
import { archiveBrandAction } from "@/lib/brands/actions";

export function ArchiveBrandButton({ brandId }: { brandId: string }) {
  const t = useTranslations("brands");

  return (
    <form
      action={archiveBrandAction}
      onSubmit={(e) => {
        if (!window.confirm(t("archiveConfirm"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="brandId" value={brandId} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-red-600"
      >
        <Archive className="size-4" />
        {t("archive")}
      </button>
    </form>
  );
}
