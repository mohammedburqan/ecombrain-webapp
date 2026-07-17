"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Package, Target } from "lucide-react";
import { BrandStatusBadge } from "./BrandStatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BrandWithProgress } from "@/lib/brands/queries";

export function BrandCard({ brand }: { brand: BrandWithProgress }) {
  const t = useTranslations("brands");
  const format = useFormatter();
  const pct = brand.totalSteps
    ? (brand.approvedCount / brand.totalSteps) * 100
    : 0;

  return (
    <Link
      href={`/dashboard/brands/${brand.id}`}
      className="group block rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand-purple/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-lg font-bold text-ink group-hover:text-brand-accent">
          {brand.name}
        </h3>
        <BrandStatusBadge status={brand.status} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <Package className="size-4 shrink-0" />
          <dd className="truncate">{brand.product_name}</dd>
        </div>
        {brand.target_market ? (
          <div className="flex items-center gap-2">
            <Target className="size-4 shrink-0" />
            <dd className="truncate">{brand.target_market}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>{t("progressLabel")}</span>
          <span>
            {t("stepsComplete", {
              done: brand.approvedCount,
              total: brand.totalSteps,
            })}
          </span>
        </div>
        <ProgressBar value={pct} />
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        {t("createdOn", {
          date: format.dateTime(new Date(brand.created_at), {
            dateStyle: "medium",
          }),
        })}
      </p>
    </Link>
  );
}
