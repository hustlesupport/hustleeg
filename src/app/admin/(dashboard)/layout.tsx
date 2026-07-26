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
    <div className="min-h-screen bg-off-white text-matte-black md:flex">
      <MobileAdminHeader admin={{ name: admin.name, role: admin.role }} />
      <aside className="hidden w-56 flex-shrink-0 border-r border-matte-black/10 bg-matte-black p-6 text-off-white md:block">
        <p className="font-display text-lg mb-8 text-off-white">HUSTLE</p>
        <AdminNav />
        <div className="mt-10 border-t border-off-white/15 pt-4">
          <p className="font-mono text-xs text-off-white">{admin.name}</p>
          <p className="font-mono text-[10px] uppercase text-off-white/50 mt-0.5">{admin.role}</p>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1 p-4 sm:p-6 md:p-10">{children}</div>
    </div>
  );
}
