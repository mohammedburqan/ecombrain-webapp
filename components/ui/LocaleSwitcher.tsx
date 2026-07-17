"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/i18n/locale";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

// Segmented ar/en switcher. Persists the choice via a cookie (server action)
// then refreshes so the whole tree re-renders in the new language + direction.
export function LocaleSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(locale: Locale) {
    if (locale === active) return;
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5"
      role="group"
      aria-label="Language"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => select(locale)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
            locale === active
              ? "bg-brand-gradient text-white"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
