import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";

// next-intl reads the active locale (from the cookie) and loads the matching
// message catalog for every server render. No i18n routing / URL prefix.
export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
