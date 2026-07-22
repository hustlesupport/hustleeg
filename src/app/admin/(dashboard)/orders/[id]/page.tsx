import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { OrderStatusControl } from "@/components/admin/order-status-control";

export const metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const address = order.shippingAddress as {
    fullName: string;
    phone: string;
    street: string;
    building?: string | null;
    apartment?: string | null;
    area: string;
    city: string;
    governorate: string;
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">{order.orderNumber}</h1>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 mb-10">
        <div>
          <h2 className="font-ui text-sm mb-2 text-concrete-grey">Customer</h2>
          <p className="font-mono text-xs">{order.email}</p>
          <p className="font-mono text-xs">{order.phone}</p>
        </div>
        <div>
          <h2 className="font-ui text-sm mb-2 text-concrete-grey">Shipping address</h2>
          <p className="font-mono text-xs">{address.fullName}</p>
          <p className="font-mono text-xs">
            {address.street} {address.building ? `, ${address.building}` : ""}{" "}
            {address.apartment ? `, ${address.apartment}` : ""}
          </p>
          <p className="font-mono text-xs">
            {address.area}, {address.city}, {address.governorate}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse font-mono text-xs mb-8">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Qty</th>
            <th className="py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-matte-black/5">
              <td className="py-2">
                {item.productName} ({item.variantLabel})
              </td>
              <td className="py-2">{item.sku}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">{formatMoney(Number(item.total), order.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1 font-mono text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(Number(order.subtotal), order.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatMoney(Number(order.shippingTotal), order.currency)}</span>
        </div>
        <div className="flex justify-between font-ui text-sm pt-2 border-t border-matte-black/10">
          <span>Total</span>
          <span>{formatMoney(Number(order.total), order.currency)}</span>
        </div>
        <p className="pt-2 text-concrete-grey">
          {order.paymentMethod} · {order.paymentStatus}
        </p>
      </div>
    </div>
  );
}
