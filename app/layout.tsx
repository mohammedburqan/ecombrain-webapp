import type { Metadata, Viewport } from "next";
import { Tajawal, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { localeDirection, type Locale } from "@/i18n/config";
import "./globals.css";

// Primary Arabic/Latin typeface + fallback, exposed as CSS variables.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcomSkool Companion",
  description: "مركز القيادة لرحلتك في الدروبشيبنغ مع EcomSkool",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8f0291",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = localeDirection[locale as Locale] ?? "rtl";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${tajawal.variable} ${cairo.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
