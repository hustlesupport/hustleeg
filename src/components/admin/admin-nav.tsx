"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/products", label: "Products", icon: "◻" },
  { href: "/admin/locations", label: "Locations", icon: "◎" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "◆" },
  { href: "/admin/orders", label: "Orders", icon: "◇" },
  { href: "/admin/customers", label: "Customers", icon: "○" },
  { href: "/admin/discounts", label: "Discounts", icon: "%" },
  { href: "/admin/returns", label: "Returns", icon: "↩" },
  { href: "/admin/reviews", label: "Reviews", icon: "★" },
  { href: "/admin/analytics", label: "Analytics", icon: "↗" },
  { href: "/admin/staff", label: "Staff", icon: "◉" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5 font-mono text-xs">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 px-3 py-2.5 transition-all duration-150 rounded-sm relative overflow-hidden ${
              active
                ? "bg-[#c8f135]/10 text-[#c8f135]"
                : "text-off-white/50 hover:text-off-white hover:bg-off-white/5"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#c8f135]" />
            )}
            <span className={`text-xs w-4 text-center transition-transform duration-150 ${active ? "scale-110" : "group-hover:scale-110"}`}>
              {item.icon}
            </span>
            <span className="uppercase tracking-widest text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
