import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CsvImportExport } from "@/components/admin/csv-import-export";
import { getProductEngagementStats } from "@/lib/queries/analytics";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const [products, stats] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { variants: { include: { inventory: true } } },
    }),
    getProductEngagementStats(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-1">Catalog</p>
            <h1 className="font-display text-3xl text-matte-black">Products</h1>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-concrete-grey">
              {products.length} item{products.length !== 1 ? "s" : ""}
            </span>
            <Link
              href="/admin/products/new"
              className="shrink-0 bg-[#0a0a0a] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#c8f135] hover:text-[#0a0a0a] transition-colors"
            >
              + New
            </Link>
          </div>
        </div>
        <CsvImportExport />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-matte-black/15">
          <p className="font-display text-2xl text-matte-black mb-2">No products yet</p>
          <p className="font-mono text-xs text-concrete-grey mb-6">Your catalog is empty. Add your first piece.</p>
          <Link
            href="/admin/products/new"
            className="bg-[#0a0a0a] px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#c8f135] hover:text-[#0a0a0a] transition-colors"
          >
            Add first product →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const stock = p.variants.reduce(
              (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
              0
            );
            const productStats = stats[p.id] || { views: 0, carts: 0, purchases: 0 };
            const isActive = p.status === "ACTIVE";
            const isDraft = p.status === "DRAFT";

            const statusBg = isActive
              ? "bg-[#c8f135]/15 text-[#5a7000]"
              : isDraft
              ? "bg-concrete-grey/10 text-concrete-grey"
              : "bg-matte-black/5 text-matte-black/40";

            const stockColor =
              stock === 0 ? "text-red-500" : stock <= 5 ? "text-amber-500" : "text-concrete-grey";

            return (
              <div
                key={p.id}
                className={`group relative bg-white border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isActive
                    ? "border-[#c8f135]/30 hover:border-[#c8f135]/60"
                    : "border-matte-black/8 hover:border-matte-black/20"
                }`}
              >
                {/* Active accent line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c8f135]" />
                )}

                <div className="flex items-center gap-4 px-5 py-4 pl-6">
                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-ui text-sm font-semibold text-matte-black truncate">{p.name}</span>
                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${statusBg}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="font-mono text-[11px] capitalize text-concrete-grey">{p.line.toLowerCase()}</span>
                      <span className="text-matte-black/20">·</span>
                      <span className="font-mono text-[11px] text-matte-black">{formatMoney(Number(p.basePrice), p.currency)}</span>
                      <span className="text-matte-black/20">·</span>
                      <span className={`font-mono text-[11px] ${stockColor}`}>{stock} in stock</span>
                    </div>
                  </div>

                  {/* Engagement metrics — desktop */}
                  <div className="hidden sm:flex items-center shrink-0">
                    {[
                      { label: "Views", value: productStats.views },
                      { label: "Carts", value: productStats.carts },
                      { label: "Sold", value: productStats.purchases },
                    ].map((m, i) => (
                      <div
                        key={m.label}
                        className={`w-14 text-center ${i > 0 ? "border-l border-matte-black/8" : ""}`}
                      >
                        <p className="font-display text-base text-matte-black leading-none">{m.value}</p>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-concrete-grey mt-0.5">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Edit button */}
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="shrink-0 ml-2 px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest text-concrete-grey border border-matte-black/10 hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] transition-all"
                  >
                    Edit
                  </Link>
                </div>

                {/* Mobile-only stats bar */}
                <div className="sm:hidden flex border-t border-matte-black/5 divide-x divide-matte-black/5">
                  {[
                    { label: "Views", value: productStats.views },
                    { label: "Carts", value: productStats.carts },
                    { label: "Sold", value: productStats.purchases },
                  ].map((m) => (
                    <div key={m.label} className="flex-1 py-2.5 text-center">
                      <p className="font-display text-base text-matte-black leading-none">{m.value}</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-concrete-grey">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
