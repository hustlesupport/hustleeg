import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Discounts & Promotions" };

export default async function AdminDiscountsPage() {
  const promotions = await db.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Discounts &amp; Promotions</h1>
          <p className="font-mono text-xs text-concrete-grey">
            Manage automatic storewide/category sales, promo codes, and Buy 1 Get 1 (BOGO) offers.
          </p>
        </div>
        <Link
          href="/admin/discounts/new"
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black transition-colors"
        >
          Create Promotion
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[700px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
              <th className="py-3 px-3">Title / Code</th>
              <th className="py-3 px-3">Mode</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Scope</th>
              <th className="py-3 px-3">Value / Offer</th>
              <th className="py-3 px-3">Uses</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3" />
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id} className="border-b border-matte-black/5 hover:bg-off-white/40">
                <td className="py-3 px-3">
                  <div className="font-semibold text-matte-black">{p.title || "Untitled Promotion"}</div>
                  {p.code ? (
                    <span className="inline-block bg-matte-black/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      Code: {p.code}
                    </span>
                  ) : (
                    <span className="text-[10px] text-concrete-grey">No Code (Auto)</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  {p.isAutomatic ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-neon-accent/15 text-matte-black font-bold uppercase">
                      Automatic
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-matte-black/10 text-matte-black uppercase">
                      Promo Code
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-semibold">{p.type}</td>
                <td className="py-3 px-3 text-concrete-grey">
                  {p.scope === "ALL_PRODUCTS"
                    ? "Storewide"
                    : p.scope === "PRODUCT_LINE"
                    ? `Line: ${p.targetProductLine}`
                    : `Specific (${p.targetProductIds.length} items)`}
                </td>
                <td className="py-3 px-3 font-semibold">
                  {p.type === "FREE_SHIPPING"
                    ? "Free Shipping"
                    : p.type === "PERCENTAGE"
                    ? `${p.value}% OFF`
                    : p.type === "FIXED"
                    ? `${p.value} EGP OFF`
                    : `BUY ${p.buyQuantity} GET ${p.getQuantity} (${p.getDiscountPercent ?? 100}% OFF)`}
                </td>
                <td className="py-3 px-3">
                  {p.usedCount}
                  {p.usageLimit ? ` / ${p.usageLimit}` : ""}
                </td>
                <td className="py-3 px-3">
                  <span className={p.active ? "text-neon-accent font-bold" : "text-concrete-grey"}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <Link href={`/admin/discounts/${p.id}`} className="font-semibold text-matte-black hover:text-neon-accent">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 px-3 text-center text-concrete-grey">
                  No promotions or discount codes configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
