import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

function Row({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const t = await getTranslations();
  const { profile, email } = await requireAuth();
  const roleLabel =
    profile.role === "admin"
      ? t("settings.roleAdmin")
      : t("settings.roleStudent");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Card>
        <CardBody>
          <h2 className="font-bold text-ink">{t("settings.language")}</h2>
          <p className="mb-3 mt-1 text-sm text-ink-muted">
            {t("settings.languageHelp")}
          </p>
          <LocaleSwitcher />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-bold text-ink">{t("settings.profile")}</h2>
          <Row label={t("settings.fullName")} value={profile.full_name ?? "—"} />
          <Row label={t("settings.email")} value={email ?? "—"} ltr />
          <Row label={t("settings.role")} value={roleLabel} />
          {profile.community_member_id ? (
            <Row
              label={t("settings.memberId")}
              value={profile.community_member_id}
            />
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
