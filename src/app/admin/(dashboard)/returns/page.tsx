import { db } from "@/lib/db";
import { ReturnStatusControl } from "@/components/admin/return-status-control";

export const metadata = { title: "Returns & exchanges" };

export default async function AdminReturnsPage() {
  const requests = await db.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: true, customer: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Returns &amp; exchanges</h1>
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Order</th>
            <th className="py-2">Customer</th>
            <th className="py-2">Type</th>
            <th className="py-2">Reason</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-matte-black/5">
              <td className="py-3">{r.order.orderNumber}</td>
              <td className="py-3">{r.customer.email}</td>
              <td className="py-3">{r.type}</td>
              <td className="py-3 max-w-xs truncate">{r.reason}</td>
              <td className="py-3">
                <ReturnStatusControl requestId={r.id} status={r.status} />
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-concrete-grey">
                No return or exchange requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
