"use client";

import Link from "next/link";
import { useLocale } from "@/components/storefront/locale-provider";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-matte-black/10 bg-matte-black text-off-white mt-24 mb-14 md:mb-0">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-lg mb-4">HUSTLE</p>
          <p className="font-mono text-xs text-off-white/60">Built to control everything — Cairo, Egypt</p>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest space-y-2">
          <p className="text-off-white/40 mb-3">{t("footer_shop")}</p>
          <Link href="/collections/essentials" className="block hover:text-neon-accent">{t("nav_essentials")}</Link>
          <Link href="/collections/studio" className="block hover:text-neon-accent">{t("nav_studio")}</Link>
          <Link href="/collections/graffiti" className="block hover:text-neon-accent">{t("nav_graffiti")}</Link>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest space-y-2">
          <p className="text-off-white/40 mb-3">{t("footer_community")}</p>
          <Link href="/drops" className="block hover:text-neon-accent">{t("nav_drops")}</Link>
          <Link href="/account" className="block hover:text-neon-accent">{t("nav_account")}</Link>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest space-y-2">
          <p className="text-off-white/40 mb-3">{t("footer_join")}</p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 bg-transparent border border-off-white/30 px-3 py-2 text-off-white placeholder:text-off-white/40"
            />
            <button className="bg-neon-accent text-matte-black px-4 py-2">Join</button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 flex flex-col gap-4 border-t border-off-white/10 pt-6 font-mono text-[10px] uppercase tracking-widest sm:flex-row sm:items-center sm:justify-between">
        <p className="text-off-white/40">{t("footer_legal")}:</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-neon-accent">{t("legal_privacy")}</Link>
          <Link href="/terms" className="hover:text-neon-accent">{t("legal_terms")}</Link>
          <Link href="/returns" className="hover:text-neon-accent">{t("legal_returns")}</Link>
        </div>
      </div>
    </footer>
  );
}
