import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Store } from "lucide-react";
import { listBrandsWithProgress } from "@/lib/brands/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandCard } from "@/components/brands/BrandCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";

export default async function BrandsPage() {
  const t = await getTranslations();
  const brands = await listBrandsWithProgress();

  return (
    <div>
      <PageHeader
        title={t("brands.title")}
        subtitle={t("brands.subtitle")}
        action={
          brands.length > 0 ? (
            <Link
              href="/dashboard/brands/new"
              className={buttonClasses("primary")}
            >
              <Plus className="size-4" />
              {t("brands.newCta")}
            </Link>
          ) : undefined
        }
      />

      {brands.length === 0 ? (
        <EmptyState
          icon={<Store className="size-7" />}
          title={t("brands.empty")}
          description={t("brands.emptyHint")}
          action={
            <Link
              href="/dashboard/brands/new"
              className={buttonClasses("primary")}
            >
              <Plus className="size-4" />
              {t("brands.emptyCta")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      )}
    </div>
  );
}
