import {
  LayoutDashboard,
  Store,
  Plus,
  Settings,
  Users,
  BarChart3,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** key under the `nav` i18n namespace */
  labelKey: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/brands", labelKey: "myBrands", icon: Store },
  { href: "/dashboard/brands/new", labelKey: "newBrand", icon: Plus },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/dashboard/admin/students", labelKey: "students", icon: Users },
  { href: "/dashboard/admin/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/dashboard/admin/step-editor", labelKey: "stepEditor", icon: ListChecks },
];

// Active-state rule that avoids double-highlighting between "My Brands" and
// the "New Brand" item (which share a path prefix).
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/brands") {
    return (
      pathname.startsWith("/dashboard/brands") &&
      pathname !== "/dashboard/brands/new"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
