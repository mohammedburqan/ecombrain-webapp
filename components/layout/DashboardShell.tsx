"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { SwitcherBrand } from "./BrandSwitcher";

export function DashboardShell({
  isAdmin,
  brands,
  userName,
  children,
}: {
  isAdmin: boolean;
  brands: SwitcherBrand[];
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        className="fixed inset-y-0 start-0 z-40 hidden lg:flex"
      />

      {/* Mobile drawer */}
      {open ? (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <Sidebar
            isAdmin={isAdmin}
            onClose={() => setOpen(false)}
            onNavigate={() => setOpen(false)}
            className="fixed inset-y-0 start-0 z-50 shadow-2xl"
          />
        </div>
      ) : null}

      <div className="lg:ps-64">
        <Topbar
          onMenu={() => setOpen(true)}
          brands={brands}
          userName={userName}
        />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
