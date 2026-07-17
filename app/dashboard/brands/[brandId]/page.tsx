import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Info, Package, Target } from "lucide-react";
import { getBrandWorkspace } from "@/lib/brands/queries";
import { BrandStatusBadge } from "@/components/brands/BrandStatusBadge";
import { ArchiveBrandButton } from "@/components/brands/ArchiveBrandButton";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { Alert } from "@/components/ui/Alert";

export default async function BrandWorkspacePage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const t = await getTranslations();
  const workspace = await getBrandWorkspace(brandId);

  if (!workspace) notFound();

  const { brand, steps } = workspace;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-ink">{brand.name}</h1>
            <BrandStatusBadge status={brand.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4" />
              {brand.product_name}
            </span>
            {brand.target_market ? (
              <span className="inline-flex items-center gap-1.5">
                <Target className="size-4" />
                {brand.target_market}
              </span>
            ) : null}
          </div>
        </div>
        {brand.status === "active" ? (
          <ArchiveBrandButton brandId={brand.id} />
        ) : null}
      </div>

      <Alert tone="info">
        <span className="inline-flex items-center gap-2">
          <Info className="size-4 shrink-0" />
          {t("pipeline.uploadComing")}
        </span>
      </Alert>

      <PipelineView steps={steps} verdict={null} />
    </div>
  );
}
