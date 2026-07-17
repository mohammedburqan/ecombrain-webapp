import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("signUpTitle")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("signUpSubtitle")}</p>
      </div>
      <SignupForm />
    </div>
  );
}
