import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { StaffForm } from "@/components/admin/staff-form";
import { StaffRowControls } from "@/components/admin/staff-row-controls";
import { TwoFactorSetup } from "@/components/admin/two-factor-setup";

export const metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const [me, staff] = await Promise.all([
    getCurrentAdmin(),
    db.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-2">Staff</h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        No approval workflows for refunds/discounts yet — role gating (owner-only actions) and audit logging are in
        place, that piece isn&rsquo;t.
      </p>

      <div className="mb-10 border border-matte-black/10 p-4">
        <h2 className="font-ui text-sm mb-3">Your two-factor authentication</h2>
        {me && <TwoFactorSetup enabled={me.twoFactorEnabled} />}
      </div>

      {me?.role === "OWNER" && (
        <div className="mb-10 border border-matte-black/10 p-4">
          <h2 className="font-ui text-sm mb-4">Add staff member</h2>
          <StaffForm />
        </div>
      )}

      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">2FA</th>
            <th className="py-2">Status</th>
            {me?.role === "OWNER" && <th className="py-2">Role &amp; actions</th>}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-b border-matte-black/5">
              <td className="py-3">{s.name}</td>
              <td className="py-3">{s.email}</td>
              <td className="py-3">{s.twoFactorEnabled ? <span className="text-neon-accent">On</span> : "Off"}</td>
              <td className="py-3">{s.active ? <span className="text-neon-accent">Active</span> : "Inactive"}</td>
              {me?.role === "OWNER" && (
                <td className="py-3">
                  <StaffRowControls id={s.id} role={s.role} active={s.active} isSelf={s.id === me.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
