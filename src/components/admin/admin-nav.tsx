"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/staff", label: "Staff" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 font-mono text-xs uppercase tracking-widest">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block border-l-2 py-2 pl-3 transition-colors ${
              active
                ? "border-neon-accent text-neon-accent"
                : "border-transparent text-off-white/70 hover:border-off-white/30 hover:text-off-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
