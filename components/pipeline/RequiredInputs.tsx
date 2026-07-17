import { useLocale, useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import Link from "next/link";
import type { StepDetailContext } from "@/lib/brands/queries";

interface RequiredInputsProps {
  prerequisiteFiles: StepDetailContext["prerequisiteFiles"];
  brandId: string;
  requiredMcps: string[];
}

const MCP_COLORS: Record<string, string> = {
  Shopify: "bg-green-100 text-green-800 border-green-200",
  "Meta Ads": "bg-blue-100 text-blue-800 border-blue-200",
  Higgsfield: "bg-orange-100 text-orange-800 border-orange-200",
};

export function RequiredInputs({
  prerequisiteFiles,
  brandId,
  requiredMcps,
}: RequiredInputsProps) {
  const t = useTranslations("pipeline");
  const locale = useLocale();

  const hasMcps = requiredMcps.length > 0;
  const hasFiles = prerequisiteFiles.length > 0;

  if (!hasFiles && !hasMcps) {
    return (
      <p className="text-sm text-ink-muted">{t("noRequiredInputs")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {hasFiles && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">
            {t("requiredInputsTitle")}
          </p>
          <div className="space-y-2">
            {prerequisiteFiles.map((f) => {
              const stepName = locale === "ar" ? f.step_name_ar : f.step_name_en;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-4 shrink-0 text-brand-accent" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {f.original_filename ?? "file"}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {t("stepLabel", { number: f.step_sort_order })} — {stepName}
                      </p>
                    </div>
                  </div>
                  {/* Download goes through vault to generate a signed URL */}
                  <Link
                    href={`/dashboard/brands/${brandId}/vault?download=${f.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    <Download className="size-3.5" />
                    {t("downloadFile")}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasMcps && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">
            {t("requiredMcpsTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredMcps.map((mcp) => (
              <span
                key={mcp}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  MCP_COLORS[mcp] ?? "bg-canvas text-ink-muted border-line"
                }`}
              >
                {mcp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
