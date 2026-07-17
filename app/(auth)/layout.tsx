import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo showWordmark wordmarkClassName="text-white" />
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-extrabold leading-snug">
            {t("app.companion")}
          </h2>
          <p className="mt-3 text-white/85">{t("app.tagline")}</p>
        </div>
        <p className="text-sm text-white/70">© EcomSkool</p>
      </div>

      {/* Form column */}
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between p-5 lg:justify-end">
          <span className="lg:hidden">
            <Logo showWordmark />
          </span>
          <LocaleSwitcher />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
