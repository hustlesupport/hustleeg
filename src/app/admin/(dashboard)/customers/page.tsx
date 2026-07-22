import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney, daysAgo } from "@/lib/format";
import { ExportSegmentButton } from "@/components/admin/export-segment-button";
import type { CustomerSegment } from "@/actions/admin-customers";

export const metadata = { title: "Customers" };

const SEGMENTS: { value: CustomerSegment; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vip", label: "VIP" },
  { value: "first-time", label: "First-time" },
  { value: "lapsed", label: "Lapsed (90+ days)" },
];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; q?: string }>;
}) {
  const { segment: segmentParam, q } = await searchParams;
  const segment: CustomerSegment = (SEGMENTS.find((s) => s.value === segmentParam)?.value ?? "all") as CustomerSegment;
  const ninetyDaysAgo = daysAgo(90);

  const customers = await db.customer.findMany({
    where: {
      ...(segment === "vip" ? { loyaltyTier: "VIP" as const } : {}),
      ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      orders: { where: { paymentStatus: "PAID" }, select: { total: true, createdAt: true } },
    },
  });

  const withLtv = customers
    .map((c) => ({
      ...c,
      ltv: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
      orderCount: c.orders.length,
      lastOrderAt: c.orders.length ? c.orders.reduce((max, o) => (o.createdAt > max ? o.createdAt : max), c.orders[0].createdAt) : null,
    }))
    .filter((c) => {
      if (segment === "first-time") return c.orderCount === 1;
      if (segment === "lapsed") return c.orderCount > 0 && c.lastOrderAt !== null && c.lastOrderAt < ninetyDaysAgo;
      return true;
    });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Customers</h1>
        <ExportSegmentButton segment={segment} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 font-mono text-xs uppercase tracking-widest">
          {SEGMENTS.map((s) => (
            <Link
              key={s.value}
              href={`/admin/customers?segment=${s.value}`}
              className={`border px-3 py-1.5 ${
                segment === s.value ? "border-matte-black bg-matte-black text-off-white" : "border-matte-black/20"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="segment" value={segment} />
          <input name="q" defaultValue={q} placeholder="Search email…" className="input" />
        </form>
      </div>

      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Customer</th>
            <th className="py-2">Tier</th>
            <th className="py-2">Orders</th>
            <th className="py-2">LTV</th>
            <th className="py-2">Tags</th>
          </tr>
        </thead>
        <tbody>
          {withLtv.map((c) => (
            <tr key={c.id} className="border-b border-matte-black/5">
              <td className="py-3">
                <Link href={`/admin/customers/${c.id}`} className="hover:text-neon-accent">
                  {c.firstName ? `${c.firstName} ${c.lastName ?? ""}`.trim() : c.email}
                </Link>
                <p className="text-concrete-grey">{c.email}</p>
              </td>
              <td className="py-3">{c.loyaltyTier}</td>
              <td className="py-3">{c.orderCount}</td>
              <td className="py-3">{formatMoney(c.ltv)}</td>
              <td className="py-3">{c.tags.join(", ")}</td>
            </tr>
          ))}
          {withLtv.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-concrete-grey">
                No customers in this segment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
