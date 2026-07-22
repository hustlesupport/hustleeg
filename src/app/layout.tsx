import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { getLocale } from "@/lib/locale-cookie";
import { isRtl } from "@/lib/i18n";
import { LocaleProvider } from "@/components/storefront/locale-provider";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Hustle — Built to Control Everything";
const DESCRIPTION =
  "The digital flagship for Hustle. Editorial storefront, drop culture, built for Egypt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Hustle",
  },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Hustle",
    images: [{ url: "/banner1.png", width: 1774, height: 887 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/banner1.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
