import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("forgotTitle")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("forgotSubtitle")}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
