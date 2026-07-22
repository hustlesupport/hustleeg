import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CustomerTierSelect } from "@/components/admin/customer-tier-select";
import { CustomerTagsNotes } from "@/components/admin/customer-tags-notes";

export const metadata = { title: "Customer" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      addresses: true,
    },
  });
  if (!customer) notFound();

  const ltv = customer.orders.filter((o) => o.paymentStatus === "PAID").reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-1">
        {customer.firstName ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : customer.email}
      </h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        {customer.email} · {customer.phone ?? "no phone"} · {customer.memberNumber}
      </p>

      <div className="grid gap-8 sm:grid-cols-2 mb-10">
        <div className="border border-matte-black/10 p-4">
          <p className="font-mono text-xs uppercase text-concrete-grey mb-2">Loyalty tier</p>
          <CustomerTierSelect customerId={customer.id} tier={customer.loyaltyTier} />
          <p className="font-mono text-xs text-concrete-grey mt-3">{customer.loyaltyPoints} points</p>
        </div>
        <div className="border border-matte-black/10 p-4">
          <p className="font-mono text-xs uppercase text-concrete-grey mb-2">Lifetime value</p>
          <p className="font-display text-2xl">{formatMoney(ltv)}</p>
          <p className="font-mono text-xs text-concrete-grey mt-1">{customer.orders.length} orders</p>
        </div>
      </div>

      <div className="mb-10 border border-matte-black/10 p-4">
        <CustomerTagsNotes
          customerId={customer.id}
          initialTags={customer.tags}
          initialNotes={customer.adminNotes ?? ""}
        />
      </div>

      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-ui text-lg mb-4">Orders</h2>
          <div className="divide-y divide-matte-black/10 border border-matte-black/10">
            {customer.orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex justify-between px-4 py-3 font-mono text-xs hover:text-neon-accent"
              >
                <span>{o.orderNumber}</span>
                <span>{formatMoney(Number(o.total), o.currency)}</span>
              </Link>
            ))}
            {customer.orders.length === 0 && (
              <p className="px-4 py-3 font-mono text-xs text-concrete-grey">No orders yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-ui text-lg mb-4">Addresses</h2>
          <div className="divide-y divide-matte-black/10 border border-matte-black/10">
            {customer.addresses.map((a) => (
              <div key={a.id} className="px-4 py-3 font-mono text-xs">
                <p>{a.fullName}</p>
                <p className="text-concrete-grey">
                  {a.street}, {a.area}, {a.city}, {a.governorate}
                </p>
              </div>
            ))}
            {customer.addresses.length === 0 && (
              <p className="px-4 py-3 font-mono text-xs text-concrete-grey">No saved addresses.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
