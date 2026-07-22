import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Discounts" };

export default async function AdminDiscountsPage() {
  const codes = await db.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Discounts &amp; promotions</h1>
        <Link
          href="/admin/discounts/new"
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
        >
          New code
        </Link>
      </div>

      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Code</th>
            <th className="py-2">Type</th>
            <th className="py-2">Value</th>
            <th className="py-2">Used</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id} className="border-b border-matte-black/5">
              <td className="py-3">{c.code}</td>
              <td className="py-3">{c.type}</td>
              <td className="py-3">
                {c.type === "FREE_SHIPPING" ? "—" : c.type === "PERCENTAGE" ? `${c.value}%` : `${c.value} EGP`}
              </td>
              <td className="py-3">
                {c.usedCount}
                {c.usageLimit ? ` / ${c.usageLimit}` : ""}
              </td>
              <td className="py-3">
                <span className={c.active ? "text-neon-accent" : "text-concrete-grey"}>
                  {c.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="py-3">
                <Link href={`/admin/discounts/${c.id}`} className="hover:text-neon-accent">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {codes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-concrete-grey">
                No discount codes yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
