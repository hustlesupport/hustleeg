import { notFound } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ReturnRequestForm } from "@/components/storefront/return-request-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order detail" };

const RETURN_ELIGIBLE_STATUSES = new Set(["SHIPPED", "DELIVERED", "FULFILLED"]);

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, returnRequests: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || order.customerId !== customer.id) notFound();

  const address = order.shippingAddress as {
    fullName: string;
    street: string;
    area: string;
    city: string;
    governorate: string;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">{order.orderNumber}</h1>
        <span className="font-mono text-xs uppercase text-concrete-grey">{order.status}</span>
      </div>

      <div className="mb-8 divide-y divide-matte-black/10 border border-matte-black/10">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between px-4 py-3 font-mono text-xs">
            <span>
              {item.productName} ({item.variantLabel}) × {item.quantity}
            </span>
            <span>{formatMoney(Number(item.total), order.currency)}</span>
          </div>
        ))}
      </div>

      <div className="mb-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-ui text-sm mb-2 text-concrete-grey">Shipping to</h2>
          <p className="font-mono text-xs">{address.fullName}</p>
          <p className="font-mono text-xs">
            {address.street}, {address.area}, {address.city}, {address.governorate}
          </p>
        </div>
        <div>
          <h2 className="font-ui text-sm mb-2 text-concrete-grey">Total</h2>
          <p className="font-mono text-xs">{formatMoney(Number(order.total), order.currency)}</p>
          <p className="font-mono text-xs text-concrete-grey mt-1">
            {order.paymentMethod} · {order.paymentStatus}
          </p>
        </div>
      </div>

      <h2 className="font-ui text-lg mb-4">Returns &amp; exchanges</h2>
      <div className="space-y-4">
        {order.returnRequests.map((r) => (
          <div key={r.id} className="border border-matte-black/10 p-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="uppercase">{r.type}</span>
              <span className="text-neon-accent">{r.status}</span>
            </div>
            <p className="mt-2 text-concrete-grey">{r.reason}</p>
          </div>
        ))}

        {RETURN_ELIGIBLE_STATUSES.has(order.status) ? (
          <ReturnRequestForm orderId={order.id} />
        ) : (
          <p className="font-mono text-xs text-concrete-grey">
            Returns and exchanges open up once this order has shipped.
          </p>
        )}
      </div>
    </div>
  );
}
