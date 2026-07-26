"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

export function MobileAdminHeader({
  admin,
}: {
  admin: { name: string; role: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="block border-b border-matte-black/10 bg-matte-black text-off-white md:hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/admin" className="font-display text-lg tracking-widest text-off-white">
          HUSTLE ADMIN
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center border border-off-white/20 text-off-white hover:bg-off-white/10"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-off-white/15 px-6 py-6 bg-matte-black animate-in slide-in-from-top duration-200">
          <AdminNav onNavigate={() => setOpen(false)} />
          <div className="mt-8 border-t border-off-white/15 pt-4">
            <p className="font-mono text-xs text-off-white">{admin.name}</p>
            <p className="font-mono text-[10px] uppercase text-off-white/50 mt-0.5">{admin.role}</p>
            <div className="mt-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
