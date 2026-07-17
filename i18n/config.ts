// Locale configuration for the EcomSkool Companion App.
// Arabic (ar) is the default; English (en) is the secondary language.
// We use next-intl WITHOUT locale-prefixed routing: the active locale is
// stored in a cookie so URLs stay clean (/dashboard, not /ar/dashboard).

export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "NEXT_LOCALE";
