import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Order history" };

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await db.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Order history</h1>
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.orderNumber}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-xs hover:text-neon-accent"
          >
            <span>{o.orderNumber}</span>
            <span className="text-concrete-grey">{o.createdAt.toLocaleDateString("en-EG")}</span>
            <span>{formatMoney(Number(o.total), o.currency)}</span>
            <span>{o.status}</span>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="px-4 py-6 font-mono text-xs text-concrete-grey">
            No orders yet —{" "}
            <Link href="/" className="underline">
              start shopping
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
