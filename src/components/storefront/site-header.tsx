"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/storefront/cart-provider";
import { useLocale } from "@/components/storefront/locale-provider";
import type { TranslationKey } from "@/lib/i18n";

const NAV_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/collections/essentials", key: "nav_essentials" },
  { href: "/collections/studio", key: "nav_studio" },
  { href: "/collections/graffiti", key: "nav_graffiti" },
  { href: "/journal", key: "nav_journal" },
  { href: "/drops", key: "nav_drop" },
];

export function SiteHeader() {
  const { cart, open } = useCart();
  const { t, locale, setLocale } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-matte-black/10 bg-off-white text-matte-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brandLogo.png" alt="Hustle" width={36} height={36} priority className="h-9 w-9" />
          <span className="font-display text-xl">HUSTLE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-neon-accent">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-widest">
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="hover:text-neon-accent"
            aria-label="Toggle language"
          >
            {locale === "en" ? "AR" : "EN"}
          </button>
          <Link href="/search" className="hover:text-neon-accent">
            {t("nav_search")}
          </Link>
          <Link href="/account" className="hidden sm:inline hover:text-neon-accent">
            {t("nav_account")}
          </Link>
          <button onClick={open} className="hover:text-neon-accent" aria-label="Open cart">
            {t("nav_bag")} ({cart.itemCount})
          </button>
        </div>
      </div>

      {/* Mobile bottom nav — one-thumb browsing per blueprint p.06 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden justify-around border-t border-matte-black/10 bg-off-white text-matte-black py-2 font-mono text-[10px] uppercase tracking-widest">
        <Link href="/" className="px-2 py-1">
          {t("nav_home")}
        </Link>
        <Link href="/search" className="px-2 py-1">
          {t("nav_search")}
        </Link>
        <Link href="/drops" className="px-2 py-1">
          {t("nav_drops")}
        </Link>
        <Link href="/account" className="px-2 py-1">
          {t("nav_account")}
        </Link>
        <button onClick={open} className="px-2 py-1">
          {t("nav_bag")} ({cart.itemCount})
        </button>
      </nav>
    </header>
  );
}
