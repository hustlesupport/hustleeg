import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { getLocale } from "@/lib/locale-cookie";
import { isRtl } from "@/lib/i18n";
import { LocaleProvider } from "@/components/storefront/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hustle — Built to Control Everything",
    template: "%s — Hustle",
  },
  description:
    "The digital flagship for Hustle. Editorial storefront, drop culture, built for Egypt.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const rtl = isRtl(locale);

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-off-white text-matte-black">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
