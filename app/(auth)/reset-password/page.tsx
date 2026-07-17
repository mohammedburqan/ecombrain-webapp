import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("resetTitle")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("resetSubtitle")}</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
