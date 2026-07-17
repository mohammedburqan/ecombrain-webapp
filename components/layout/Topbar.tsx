"use client";

import { useTranslations } from "next-intl";
import { LogOut, Menu } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { BrandSwitcher, type SwitcherBrand } from "./BrandSwitcher";

export function Topbar({
  onMenu,
  brands,
  userName,
}: {
  onMenu: () => void;
  brands: SwitcherBrand[];
  userName: string;
}) {
  const t = useTranslations();
  const initial = (userName.trim()[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label={t("common.menu")}
        className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <BrandSwitcher brands={brands} />
      </div>

      <div className="hidden sm:block">
        <LocaleSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <span
          className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white sm:flex"
          title={userName}
          aria-hidden
        >
          {initial}
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label={t("nav.signOut")}
            title={t("nav.signOut")}
            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <LogOut className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
