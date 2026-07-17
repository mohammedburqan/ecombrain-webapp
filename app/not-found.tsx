import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClasses } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Logo showWordmark />
      <div>
        <p className="text-6xl font-extrabold text-brand-gradient">404</p>
        <p className="mt-2 text-ink-muted">{t("common.error")}</p>
      </div>
      <Link href="/dashboard" className={buttonClasses("primary")}>
        {t("nav.dashboard")}
      </Link>
    </div>
  );
}
