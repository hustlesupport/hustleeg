import { db } from "@/lib/db";
import { ReviewModerationRow } from "@/components/admin/review-moderation-row";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    include: { product: { select: { name: true, slug: true } }, customer: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Reviews</h1>
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Product</th>
            <th className="py-2">Customer</th>
            <th className="py-2">Rating</th>
            <th className="py-2">Review</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-b border-matte-black/5 align-top">
              <td className="py-3">{r.product.name}</td>
              <td className="py-3">{r.customer.email}</td>
              <td className="py-3">{"★".repeat(r.rating)}</td>
              <td className="py-3 max-w-sm">
                {r.title && <p className="font-semibold">{r.title}</p>}
                <p className="text-concrete-grey">{r.body}</p>
              </td>
              <td className="py-3">
                <span className={r.approved ? "text-neon-accent" : "text-concrete-grey"}>
                  {r.approved ? "Published" : "Pending"}
                </span>
              </td>
              <td className="py-3">
                <ReviewModerationRow reviewId={r.id} approved={r.approved} />
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-concrete-grey">
                No reviews yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
