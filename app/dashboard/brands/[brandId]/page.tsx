import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Package, Target } from "lucide-react";
import { getBrandWorkspace } from "@/lib/brands/queries";
import { BrandStatusBadge } from "@/components/brands/BrandStatusBadge";
import { ArchiveBrandButton } from "@/components/brands/ArchiveBrandButton";
import { RoadmapView } from "@/components/pipeline/RoadmapView";
import { ValidationForkBanner } from "@/components/pipeline/ValidationForkBanner";
import { buttonClasses } from "@/components/ui/Button";

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

  // Determine validation verdict from the validation step file (Phase 3: parsed_data).
  // For now pass null — the banner only shows on a definitive No-Go verdict.
  const verdict = null;

  return (
    <div className="space-y-6">
      {/* Brand header */}
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

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/brands/${brand.id}/vault`}
            className={buttonClasses("secondary", "sm")}
          >
            {t("pipeline.viewVault")}
          </Link>
          {brand.status === "active" ? (
            <ArchiveBrandButton brandId={brand.id} />
          ) : null}
        </div>
      </div>

      {/* Validation fork banner (Phase 3 will wire in parsed verdict) */}
      {verdict !== null && (
        <ValidationForkBanner verdict={verdict} />
      )}

      {/* Roadmap */}
      <RoadmapView steps={steps} brandId={brand.id} />
    </div>
  );
}
