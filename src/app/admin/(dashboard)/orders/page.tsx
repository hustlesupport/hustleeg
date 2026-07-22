import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Orders</h1>
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Order</th>
            <th className="py-2">Customer</th>
            <th className="py-2">Total</th>
            <th className="py-2">Payment</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-matte-black/5">
              <td className="py-3">
                <Link href={`/admin/orders/${o.id}`} className="hover:text-neon-accent">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="py-3">{o.email}</td>
              <td className="py-3">{formatMoney(Number(o.total), o.currency)}</td>
              <td className="py-3">
                {o.paymentMethod} · {o.paymentStatus}
              </td>
              <td className="py-3">{o.status}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-concrete-grey">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
