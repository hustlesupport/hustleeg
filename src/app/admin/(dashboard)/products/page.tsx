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
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="shrink-0 bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black transition-colors"
        >
          + New
        </Link>
      </div>

      <div className="mb-8">
        <CsvImportExport />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-matte-black/20 rounded">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-4">No products yet</p>
          <Link href="/admin/products/new" className="font-mono text-xs text-neon-accent uppercase tracking-widest hover:underline">
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const stock = p.variants.reduce(
              (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
              0
            );
            const productStats = stats[p.id] || { views: 0, carts: 0, purchases: 0 };
            const statusColor =
              p.status === "ACTIVE"
                ? "bg-neon-accent/15 text-neon-accent"
                : p.status === "DRAFT"
                ? "bg-concrete-grey/15 text-concrete-grey"
                : "bg-matte-black/5 text-matte-black/40";

            return (
              <div
                key={p.id}
                className="group border border-matte-black/10 bg-white hover:border-matte-black/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4 p-4">
                  {/* Left: name + badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-ui text-sm font-medium text-matte-black truncate">{p.name}</p>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusColor}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-concrete-grey">
                      <span className="capitalize">{p.line.toLowerCase()}</span>
                      <span>·</span>
                      <span>{formatMoney(Number(p.basePrice), p.currency)}</span>
                      <span>·</span>
                      <span className={stock === 0 ? "text-red-400" : stock <= 5 ? "text-amber-500" : ""}>
                        {stock} in stock
                      </span>
                    </div>
                  </div>
                  {/* Right: edit */}
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-concrete-grey hover:text-neon-accent transition-colors"
                  >
                    Edit →
                  </Link>
                </div>

                {/* Engagement stats bar */}
                <div className="flex items-center gap-0 border-t border-matte-black/5 divide-x divide-matte-black/5">
                  {[
                    { label: "Views", value: productStats.views, icon: "👁" },
                    { label: "Carts", value: productStats.carts, icon: "🛒" },
                    { label: "Sold", value: productStats.purchases, icon: "✓" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex-1 px-4 py-2.5 text-center">
                      <p className="font-display text-base text-matte-black">{stat.value}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey">{stat.label}</p>
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

