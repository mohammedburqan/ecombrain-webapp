import { requireAuth } from "@/lib/auth/session";
import { listBrands } from "@/lib/brands/queries";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, email } = await requireAuth();
  const brands = await listBrands();

  return (
    <DashboardShell
      isAdmin={profile.role === "admin"}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      userName={profile.full_name ?? email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
