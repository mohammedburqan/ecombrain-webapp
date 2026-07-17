import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Boxes, Plus, Rocket, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listBrandsWithProgress } from "@/lib/brands/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BrandCard } from "@/components/brands/BrandCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";

export default async function DashboardPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const brands = await listBrandsWithProgress();

  const firstName =
    (user?.profile.full_name ?? "").trim().split(" ")[0] || (user?.email ?? "");
  const total = brands.length;
  const active = brands.filter((b) => b.status === "active").length;
  const launched = brands.filter((b) => b.status === "launched").length;
  const recent = brands.slice(0, 4);

  return (
    <div>
      <PageHeader
        title={t("dashboard.welcome", { name: firstName })}
        subtitle={t("dashboard.welcomeSub")}
        action={
          <Link href="/dashboard/brands/new" className={buttonClasses("primary")}>
            <Plus className="size-4" />
            {t("brands.newCta")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.totalBrands")}
          value={total}
          icon={<Boxes className="size-5" />}
        />
        <StatCard
          label={t("dashboard.activeBrands")}
          value={active}
          icon={<Store className="size-5" />}
        />
        <StatCard
          label={t("dashboard.launchedBrands")}
          value={launched}
          icon={<Rocket className="size-5" />}
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {t("dashboard.recentBrands")}
          </h2>
          {total > 0 ? (
            <Link
              href="/dashboard/brands"
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              {t("dashboard.viewAll")}
            </Link>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Store className="size-7" />}
            title={t("dashboard.noBrandsYet")}
            description={t("dashboard.noBrandsHint")}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recent.map((b) => (
              <BrandCard key={b.id} brand={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
