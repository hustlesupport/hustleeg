import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { MobileAdminHeader } from "@/components/admin/mobile-admin-header";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f5f4f0] md:flex">
      <MobileAdminHeader admin={{ name: admin.name, role: admin.role }} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col bg-[#0a0a0a] text-off-white relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />

        {/* Neon accent glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8f135] to-transparent opacity-60" />

        <div className="relative flex flex-col h-full p-6">
          {/* Brand */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#c8f135] flex items-center justify-center">
                <span className="font-display text-sm text-[#0a0a0a] font-bold">H</span>
              </div>
              <p className="font-display text-base tracking-[0.2em] text-off-white">HUSTLE</p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-off-white/30 ml-11">Admin Panel</p>
          </div>

          {/* Nav */}
          <div className="flex-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-off-white/25 mb-3">Navigation</p>
            <AdminNav />
          </div>

          {/* User footer */}
          <div className="border-t border-off-white/10 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#c8f135]/20 border border-[#c8f135]/30 flex items-center justify-center">
                <span className="font-mono text-xs text-[#c8f135]">{admin.name[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-off-white truncate">{admin.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-off-white/40">{admin.role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">{children}</div>
    </div>
  );
}
