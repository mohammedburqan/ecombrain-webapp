"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { mainNav, adminNav, isNavActive, type NavItem } from "./nav";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  label,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-gradient text-white shadow-sm"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({
  isAdmin,
  onNavigate,
  onClose,
  className,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <aside
      className={cn(
        "flex w-64 flex-col bg-sidebar text-white scrollbar-thin",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <Logo showWordmark wordmarkClassName="text-white" />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            label={t(item.labelKey)}
            active={isNavActive(item.href, pathname)}
            onNavigate={onNavigate}
          />
        ))}

        {isAdmin ? (
          <div className="pt-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted/70">
              {t("adminSection")}
            </p>
            <div className="space-y-1 border-t border-sidebar-border pt-2">
              {adminNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  label={t(item.labelKey)}
                  active={isNavActive(item.href, pathname)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
