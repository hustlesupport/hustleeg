"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/storefront/locale-provider";
import type { TranslationKey } from "@/lib/i18n";

const NAV: { href: string; key: TranslationKey }[] = [
  { href: "/account", key: "account_overview" },
  { href: "/account/orders", key: "account_orders" },
  { href: "/account/addresses", key: "account_addresses" },
  { href: "/account/wishlist", key: "account_wishlist" },
  { href: "/account/returns", key: "account_returns" },
  { href: "/account/referrals", key: "account_referrals" },
  { href: "/account/profile", key: "account_profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-matte-black/10 font-mono text-xs uppercase tracking-widest md:flex-col md:gap-0.5 md:overflow-visible md:border-b-0 md:border-r md:pr-6">
      {NAV.map((item) => {
        const active = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 md:border-b-0 md:border-l-2 md:px-3 md:py-2 ${
              active
                ? "border-matte-black text-matte-black"
                : "border-transparent text-concrete-grey hover:text-matte-black"
            }`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
