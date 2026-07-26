"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/admin-auth";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await logoutAction();
        router.push("/admin/login");
        router.refresh();
      }}
      className="w-full border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:border-[#c8f135]/50 hover:text-[#c8f135] transition-all text-left"
    >
      Sign out →
    </button>
  );
}
