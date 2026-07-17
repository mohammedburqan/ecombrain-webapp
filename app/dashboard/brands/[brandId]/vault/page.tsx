import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getVaultFiles } from "@/lib/brands/queries";
import { VaultView } from "@/components/vault/VaultView";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Brand } from "@/types/database";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const t = await getTranslations();

  const supabase = await createSupabaseServerClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand) notFound();

  const groups = await getVaultFiles(brandId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link
          href={`/dashboard/brands/${(brand as Brand).id}`}
          className="hover:text-ink transition-colors"
        >
          {(brand as Brand).name}
        </Link>
        <ArrowRight className="size-3.5 rotate-180 rtl:rotate-0" />
        <span className="text-ink font-medium">{t("vault.title")}</span>
      </div>

      <PageHeader
        title={t("vault.title")}
        subtitle={t("vault.subtitle")}
      />

      <VaultView groups={groups} brandId={brandId} />
    </div>
  );
}
