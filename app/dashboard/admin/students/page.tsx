import { getTranslations } from "next-intl/server";
import { Construction } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AdminStudentsPage() {
  await requireAdmin();
  const t = await getTranslations();
  return (
    <div>
      <PageHeader
        title={t("admin.studentsTitle")}
        subtitle={t("admin.studentsSubtitle")}
      />
      <EmptyState
        icon={<Construction className="size-7" />}
        title={t("common.comingSoon")}
        description={t("admin.comingSoonBody")}
      />
    </div>
  );
}
