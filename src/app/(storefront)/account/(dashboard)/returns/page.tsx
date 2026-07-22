import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";

export const metadata = { title: "Returns & exchanges" };

export default async function ReturnsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const requests = await db.returnRequest.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { order: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Returns &amp; exchanges</h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        Start a request from any eligible order in your{" "}
        <Link href="/account/orders" className="underline">
          order history
        </Link>
        .
      </p>
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/account/orders/${r.order.orderNumber}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-xs hover:text-neon-accent"
          >
            <span>{r.order.orderNumber}</span>
            <span className="uppercase">{r.type}</span>
            <span className="text-concrete-grey">{r.createdAt.toLocaleDateString("en-EG")}</span>
            <span>{r.status}</span>
          </Link>
        ))}
        {requests.length === 0 && (
          <p className="px-4 py-6 font-mono text-xs text-concrete-grey">No requests yet.</p>
        )}
      </div>
    </div>
  );
}
