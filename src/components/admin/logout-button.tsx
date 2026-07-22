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
      className="mt-3 border border-off-white/20 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-off-white hover:border-neon-accent hover:text-neon-accent"
    >
      Sign out
    </button>
  );
}
