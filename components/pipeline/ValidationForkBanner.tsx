"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, XCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

// Rendered on the brand workspace once step 3 (validation) carries a verdict.
// Phase 1 has no parsing yet, so callers pass verdict = null and this renders
// nothing. Wired now so the fork UI is ready for Phase 2.
export type ValidationVerdict = "conditional" | "nogo";

export function ValidationForkBanner({
  verdict,
}: {
  verdict: ValidationVerdict;
}) {
  const t = useTranslations("pipeline");

  if (verdict === "conditional") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{t("forkConditionalTitle")}</p>
            <p className="mt-1 text-sm">{t("forkConditionalBody")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      <div className="flex items-start gap-2">
        <XCircle className="mt-0.5 size-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">{t("forkNoGoTitle")}</p>
          <p className="mt-1 text-sm">{t("forkNoGoBody")}</p>
          <Link
            href="/dashboard/brands/new"
            className={`${buttonClasses("primary", "sm")} mt-3`}
          >
            {t("forkRestart")}
          </Link>
        </div>
      </div>
    </div>
  );
}
