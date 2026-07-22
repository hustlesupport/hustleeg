import "server-only";
import { db } from "@/lib/db";

const THIRTY_DAYS = new Date(Date.now() - 30 * 86_400_000);

export async function getSalesByLine() {
  const items = await db.orderItem.findMany({
    where: { order: { paymentStatus: "PAID" } },
    select: { total: true, variant: { select: { product: { select: { line: true } } } } },
  });
  const byLine = new Map<string, number>();
  for (const item of items) {
    const line = item.variant.product.line;
    byLine.set(line, (byLine.get(line) ?? 0) + Number(item.total));
  }
  return Array.from(byLine.entries()).map(([line, total]) => ({ line, total }));
}

export async function getTopProducts(limit = 10) {
  const items = await db.orderItem.findMany({
    where: { order: { paymentStatus: "PAID" } },
    select: { total: true, quantity: true, productName: true },
  });
  const byProduct = new Map<string, { revenue: number; units: number }>();
  for (const item of items) {
    const entry = byProduct.get(item.productName) ?? { revenue: 0, units: 0 };
    entry.revenue += Number(item.total);
    entry.units += item.quantity;
    byProduct.set(item.productName, entry);
  }
  return Array.from(byProduct.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getFunnel(since = THIRTY_DAYS) {
  const [views, addToCarts, checkoutsStarted, orders] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "PRODUCT_VIEW", createdAt: { gte: since } } }),
    db.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "ADD_TO_CART", createdAt: { gte: since } } }),
    db.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "CHECKOUT_STARTED", createdAt: { gte: since } } }),
    db.order.count({ where: { createdAt: { gte: since } } }),
  ]);
  return {
    viewed: views.length,
    addedToCart: addToCarts.length,
    startedCheckout: checkoutsStarted.length,
    ordered: orders,
  };
}

export async function getInventoryTurnover(limit = 10) {
  const [sold, products] = await Promise.all([
    db.orderItem.groupBy({
      by: ["sku"],
      where: { order: { createdAt: { gte: THIRTY_DAYS }, paymentStatus: "PAID" } },
      _sum: { quantity: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      select: { name: true, variants: { select: { sku: true, inventory: { select: { quantity: true } } } } },
    }),
  ]);

  const soldBySku = new Map(sold.map((s) => [s.sku, s._sum.quantity ?? 0]));

  const rows = products.map((p) => {
    const currentStock = p.variants.reduce((sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0), 0);
    const unitsSold = p.variants.reduce((sum, v) => sum + (soldBySku.get(v.sku) ?? 0), 0);
    return { name: p.name, unitsSold, currentStock, turnoverRate: currentStock > 0 ? unitsSold / currentStock : unitsSold > 0 ? Infinity : 0 };
  });

  return rows.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
}

export async function getAttributionBreakdown() {
  const orders = await db.order.groupBy({
    by: ["attributionSource"],
    where: { paymentStatus: "PAID" },
    _count: { _all: true },
    _sum: { total: true },
  });
  return orders
    .map((o) => ({
      source: o.attributionSource ?? "unknown",
      orders: o._count._all,
      revenue: Number(o._sum.total ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getCohortRetention() {
  const customers = await db.customer.findMany({
    select: { createdAt: true, orders: { select: { createdAt: true }, where: { paymentStatus: "PAID" } } },
  });

  const cohorts = new Map<string, { size: number; retained: number }>();
  for (const c of customers) {
    const cohortKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = cohorts.get(cohortKey) ?? { size: 0, retained: 0 };
    entry.size++;
    const hasRepeatOrder =
      c.orders.filter((o) => o.createdAt > new Date(c.createdAt.getTime() + 30 * 86_400_000)).length > 0;
    if (hasRepeatOrder) entry.retained++;
    cohorts.set(cohortKey, entry);
  }

  return Array.from(cohorts.entries())
    .map(([cohort, stats]) => ({ cohort, ...stats, retentionRate: stats.size > 0 ? stats.retained / stats.size : 0 }))
    .sort((a, b) => (a.cohort < b.cohort ? 1 : -1));
}

export async function getLiveDropPerformance() {
  const liveCampaigns = await db.campaign.findMany({
    where: { status: "LIVE" },
    include: {
      products: {
        include: { variants: { include: { inventory: true, orderItems: { where: { order: { paymentStatus: "PAID" } } } } } },
      },
    },
  });

  return liveCampaigns.map((c) => {
    let totalUnits = 0;
    let soldUnits = 0;
    let revenue = 0;
    for (const p of c.products) {
      for (const v of p.variants) {
        const stock = v.inventory.reduce((s, i) => s + i.quantity, 0);
        const sold = v.orderItems.reduce((s, i) => s + i.quantity, 0);
        totalUnits += stock + sold;
        soldUnits += sold;
        revenue += v.orderItems.reduce((s, i) => s + Number(i.total), 0);
      }
    }
    return {
      name: c.name,
      soldUnits,
      totalUnits,
      sellThroughRate: totalUnits > 0 ? soldUnits / totalUnits : 0,
      revenue,
    };
  });
}
