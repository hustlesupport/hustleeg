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

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        <div className="border border-matte-black/10 p-6">
          <p className="font-mono text-xs uppercase text-concrete-grey">Total orders</p>
          <p className="font-display text-3xl mt-2">{orderCount}</p>
        </div>
        <div className="border border-matte-black/10 p-6">
          <p className="font-mono text-xs uppercase text-concrete-grey">Revenue (paid)</p>
          <p className="font-display text-3xl mt-2">
            {formatMoney(Number(revenueAgg._sum.total ?? 0))}
          </p>
        </div>
        <div className="border border-matte-black/10 p-6">
          <p className="font-mono text-xs uppercase text-concrete-grey">Low stock alerts</p>
          <p className="font-display text-3xl mt-2">{lowStock.length}</p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-ui text-lg mb-4">Pending orders</h2>
          <div className="divide-y divide-matte-black/10 border border-matte-black/10">
            {pendingOrders.map((o) => (
              <div key={o.id} className="flex justify-between px-4 py-3 font-mono text-xs">
                <span>{o.orderNumber}</span>
                <span>{formatMoney(Number(o.total), o.currency)}</span>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="px-4 py-3 font-mono text-xs text-concrete-grey">Nothing pending.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-ui text-lg mb-4">Low stock</h2>
          <div className="divide-y divide-matte-black/10 border border-matte-black/10">
            {lowStock.map((item) => (
              <div key={item.id} className="flex justify-between px-4 py-3 font-mono text-xs">
                <span>
                  {item.variant.product.name} ({item.variant.size}/{item.variant.color})
                </span>
                <span className="text-neon-accent">{item.quantity} left</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="px-4 py-3 font-mono text-xs text-concrete-grey">Stock levels are healthy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
