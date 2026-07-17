import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("signInTitle")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("signInSubtitle")}</p>
      </div>
      <LoginForm />
    </div>
  );
}
