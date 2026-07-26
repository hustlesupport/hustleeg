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
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#0a0a0a] px-5 py-4 md:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#c8f135] flex items-center justify-center">
            <span className="font-display text-xs text-[#0a0a0a] font-bold">H</span>
          </div>
          <Link href="/admin" className="font-display text-sm tracking-[0.2em] text-white">
            HUSTLE
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5"
          aria-label="Toggle menu"
        >
          <span className={`block h-px w-5 bg-white transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-px w-5 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-px w-5 bg-white transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </header>

      {/* Full-screen drawer overlay */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-72 bg-[#0a0a0a] flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8f135] to-transparent opacity-60" />

          <div className="flex-1 overflow-y-auto px-6 pt-20 pb-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/25 mb-4">Navigation</p>
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#c8f135]/20 border border-[#c8f135]/30 flex items-center justify-center">
                <span className="font-mono text-sm text-[#c8f135]">{admin.name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-mono text-xs text-white">{admin.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">{admin.role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  );
}
