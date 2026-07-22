import {
  getSalesByLine,
  getTopProducts,
  getFunnel,
  getInventoryTurnover,
  getAttributionBreakdown,
  getCohortRetention,
  getLiveDropPerformance,
} from "@/lib/queries/analytics";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [salesByLine, topProducts, funnel, turnover, attribution, cohorts, liveDrops] = await Promise.all([
    getSalesByLine(),
    getTopProducts(),
    getFunnel(),
    getInventoryTurnover(),
    getAttributionBreakdown(),
    getCohortRetention(),
    getLiveDropPerformance(),
  ]);

  return (
    <div className="space-y-16">
      <div>
        <h1 className="font-display text-2xl mb-2">Analytics</h1>
        <p className="font-mono text-xs text-concrete-grey">
          Funnel and attribution are computed from real events tracked as of this build — history only goes back to
          when tracking was added, not before.
        </p>
      </div>

      <section>
        <h2 className="font-ui text-lg mb-4">Sales by line</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {salesByLine.map((s) => (
            <div key={s.line} className="border border-matte-black/10 p-4">
              <p className="font-mono text-xs uppercase text-concrete-grey">{s.line}</p>
              <p className="font-display text-xl mt-1">{formatMoney(s.total)}</p>
            </div>
          ))}
          {salesByLine.length === 0 && <p className="font-mono text-xs text-concrete-grey">No paid orders yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-ui text-lg mb-4">Top products (by revenue)</h2>
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
              <th className="py-2">Product</th>
              <th className="py-2">Units sold</th>
              <th className="py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="border-b border-matte-black/5">
                <td className="py-2">{p.name}</td>
                <td className="py-2">{p.units}</td>
                <td className="py-2">{formatMoney(p.revenue)}</td>
              </tr>
            ))}
            {topProducts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-concrete-grey">
                  No paid orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-ui text-lg mb-4">Conversion funnel (last 30 days)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Viewed a product", funnel.viewed],
            ["Added to cart", funnel.addedToCart],
            ["Started checkout", funnel.startedCheckout],
            ["Placed an order", funnel.ordered],
          ].map(([label, value]) => (
            <div key={label as string} className="border border-matte-black/10 p-4">
              <p className="font-mono text-xs uppercase text-concrete-grey">{label}</p>
              <p className="font-display text-2xl mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-ui text-lg mb-4">Inventory turnover (units sold, last 30 days)</h2>
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
              <th className="py-2">Product</th>
              <th className="py-2">Sold</th>
              <th className="py-2">In stock</th>
            </tr>
          </thead>
          <tbody>
            {turnover.map((t) => (
              <tr key={t.name} className="border-b border-matte-black/5">
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.unitsSold}</td>
                <td className="py-2">{t.currentStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-ui text-lg mb-4">Marketing attribution</h2>
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
              <th className="py-2">Source</th>
              <th className="py-2">Orders</th>
              <th className="py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {attribution.map((a) => (
              <tr key={a.source} className="border-b border-matte-black/5">
                <td className="py-2">{a.source}</td>
                <td className="py-2">{a.orders}</td>
                <td className="py-2">{formatMoney(a.revenue)}</td>
              </tr>
            ))}
            {attribution.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-concrete-grey">
                  No paid orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-ui text-lg mb-4">Cohort retention (repeat purchase within 30 days)</h2>
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
              <th className="py-2">Cohort (signup month)</th>
              <th className="py-2">Size</th>
              <th className="py-2">Retained</th>
              <th className="py-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.cohort} className="border-b border-matte-black/5">
                <td className="py-2">{c.cohort}</td>
                <td className="py-2">{c.size}</td>
                <td className="py-2">{c.retained}</td>
                <td className="py-2">{(c.retentionRate * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {liveDrops.length > 0 && (
        <section>
          <h2 className="font-ui text-lg mb-4">Live drop performance</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {liveDrops.map((d) => (
              <div key={d.name} className="border border-matte-black/10 p-4">
                <p className="font-ui text-sm mb-2">{d.name}</p>
                <p className="font-mono text-xs text-concrete-grey">
                  {d.soldUnits}/{d.totalUnits} units ({(d.sellThroughRate * 100).toFixed(0)}% sell-through)
                </p>
                <p className="font-mono text-xs text-neon-accent mt-1">{formatMoney(d.revenue)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
