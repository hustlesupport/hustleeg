import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const [orderCount, revenueAgg, lowStock, pendingOrders] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    db.inventoryItem.findMany({
      where: { quantity: { lte: 5 } },
      include: { variant: { include: { product: true } } },
      take: 10,
    }),
    db.order.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-1">Command Center</p>
        <h1 className="font-display text-3xl text-matte-black">Overview</h1>
      </div>

      {/* KPI stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 mb-10">
        {/* Revenue — hero card */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden bg-[#0a0a0a] p-6 group hover:scale-[1.01] transition-transform duration-200">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8f135] to-transparent opacity-70" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#c8f135]/5 rounded-full blur-2xl" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Revenue (paid)</p>
          <p className="font-display text-4xl text-white leading-none">{formatMoney(revenue)}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[#c8f135] rounded-full" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">All-time</p>
          </div>
        </div>

        {/* Orders */}
        <div className="relative overflow-hidden border border-matte-black/10 bg-white p-6 group hover:border-matte-black/25 hover:shadow-md transition-all duration-200">
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-3">Total Orders</p>
          <p className="font-display text-4xl text-matte-black leading-none">{orderCount}</p>
          <Link href="/admin/orders" className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-concrete-grey hover:text-matte-black transition-colors">
            View all →
          </Link>
        </div>

        {/* Low stock alert */}
        <div className={`relative overflow-hidden border p-6 group hover:shadow-md transition-all duration-200 ${lowStock.length > 0 ? "border-amber-400/40 bg-amber-50" : "border-matte-black/10 bg-white"}`}>
          {lowStock.length > 0 && (
            <span className="absolute top-3 right-3 inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
          )}
          <p className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey mb-3">Low Stock</p>
          <p className={`font-display text-4xl leading-none ${lowStock.length > 0 ? "text-amber-600" : "text-matte-black"}`}>
            {lowStock.length}
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-concrete-grey">
            {lowStock.length > 0 ? "Items need attention" : "Stock levels healthy"}
          </p>
        </div>
      </div>

      {/* Lists grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-matte-black">Pending Orders</h2>
            <Link href="/admin/orders" className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey hover:text-matte-black transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingOrders.map((o) => (
              <div
                key={o.id}
                className="group flex items-center justify-between border border-matte-black/8 bg-white px-4 py-3 hover:border-matte-black/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  <span className="font-mono text-xs text-matte-black">{o.orderNumber}</span>
                </div>
                <span className="font-mono text-xs font-medium text-matte-black">
                  {formatMoney(Number(o.total), o.currency)}
                </span>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="border border-dashed border-matte-black/15 px-4 py-8 text-center">
                <p className="font-mono text-xs text-concrete-grey">No pending orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-matte-black">Low Stock</h2>
            <Link href="/admin/products" className="font-mono text-[10px] uppercase tracking-widest text-concrete-grey hover:text-matte-black transition-colors">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between border border-matte-black/8 bg-white px-4 py-3 hover:border-amber-300/50 hover:shadow-sm transition-all"
              >
                <span className="font-mono text-xs text-matte-black truncate pr-4">
                  {item.variant.product.name}
                  <span className="text-concrete-grey ml-1">({item.variant.size}/{item.variant.color})</span>
                </span>
                <span className={`shrink-0 font-mono text-xs font-semibold ${item.quantity <= 2 ? "text-red-500" : "text-amber-500"}`}>
                  {item.quantity} left
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="border border-dashed border-matte-black/15 px-4 py-8 text-center">
                <p className="font-mono text-xs text-concrete-grey">All stock levels healthy ✓</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
