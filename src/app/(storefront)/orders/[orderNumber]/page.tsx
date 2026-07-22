import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const address = order.shippingAddress as {
    fullName: string;
    street: string;
    area: string;
    city: string;
    governorate: string;
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-4">
        Order confirmed
      </p>
      <h1 className="font-display text-3xl mb-2">Thank you, {address.fullName.split(" ")[0]}</h1>
      <p className="font-mono text-sm text-concrete-grey mb-10">
        Order #{order.orderNumber} · Cash on Delivery
      </p>

      <div className="border border-matte-black/10 p-6 text-left space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between font-mono text-xs">
            <span>
              {item.productName} ({item.variantLabel}) × {item.quantity}
            </span>
            <span>{formatMoney(Number(item.total), order.currency)}</span>
          </div>
        ))}
        <div className="border-t border-matte-black/10 pt-3 flex justify-between font-ui">
          <span>Total (pay on delivery)</span>
          <span>{formatMoney(Number(order.total), order.currency)}</span>
        </div>
      </div>

      <p className="mt-8 font-mono text-xs text-concrete-grey">
        Shipping to {address.street}, {address.area}, {address.city}, {address.governorate}
      </p>
    </div>
  );
}
