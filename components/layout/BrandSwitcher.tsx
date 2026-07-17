"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Plus, Store } from "lucide-react";

export interface SwitcherBrand {
  id: string;
  name: string;
}

export function BrandSwitcher({ brands }: { brands: SwitcherBrand[] }) {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const current = typeof params.brandId === "string" ? params.brandId : "";

  if (brands.length === 0) {
    return (
      <Link
        href="/dashboard/brands/new"
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
      >
        <Plus className="size-4 text-brand-accent" />
        {t("brands.newCta")}
      </Link>
    );
  }

  return (
    <div className="relative inline-flex max-w-full items-center">
      <Store className="pointer-events-none absolute start-3 size-4 text-ink-muted" />
      <select
        aria-label={t("nav.myBrands")}
        value={current}
        onChange={(e) => {
          const value = e.target.value;
          if (value) router.push(`/dashboard/brands/${value}`);
        }}
        className="w-full max-w-[16rem] appearance-none truncate rounded-xl border border-line bg-surface py-2 ps-9 pe-9 text-sm font-medium text-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
      >
        <option value="" disabled>
          {t("nav.myBrands")}
        </option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 size-4 text-ink-muted" />
    </div>
  );
}
