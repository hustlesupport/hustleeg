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
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Returns & exchanges</h1>
        <span className="font-mono text-xs text-concrete-grey">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-matte-black/20">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey">No return or exchange requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const typeColor =
              r.type === "RETURN"
                ? "bg-red-50 text-red-600"
                : r.type === "EXCHANGE"
                ? "bg-amber-50 text-amber-600"
                : "bg-concrete-grey/10 text-concrete-grey";
            return (
              <div
                key={r.id}
                className="border border-matte-black/10 bg-white hover:border-matte-black/25 hover:shadow-sm transition-all"
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    {/* Order + customer */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-block border border-matte-black/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-matte-black">
                          {r.order.orderNumber}
                        </span>
                        <span className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${typeColor}`}>
                          {r.type}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-concrete-grey">{r.customer.email}</p>
                    </div>
                    {/* Status control */}
                    <div className="shrink-0">
                      <ReturnStatusControl requestId={r.id} status={r.status} />
                    </div>
                  </div>

                  {/* Reason */}
                  {r.reason && (
                    <p className="font-ui text-sm text-matte-black/70 leading-relaxed line-clamp-2">
                      &ldquo;{r.reason}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

