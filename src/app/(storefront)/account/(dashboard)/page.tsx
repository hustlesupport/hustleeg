import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";

export const metadata = { title: "Account" };

const TIER_LABEL: Record<string, string> = {
  MEMBER: "Member",
  INSIDER: "Insider",
  VIP: "VIP",
};

export default async function AccountOverviewPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const [orderCount, wishlistCount, recentOrders] = await Promise.all([
    db.order.count({ where: { customerId: customer.id } }),
    db.wishlistItem.count({ where: { customerId: customer.id } }),
    db.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">
        Welcome back, {customer.firstName ?? "member"}
      </h1>

      {/* Digital Community Card */}
      <div className="mb-10 max-w-md rounded-sm bg-matte-black p-6 text-off-white">
        <div className="flex items-start justify-between">
          <p className="font-display text-lg">HUSTLE</p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neon-accent">
            {TIER_LABEL[customer.loyaltyTier] ?? customer.loyaltyTier}
          </span>
        </div>
        <p className="mt-8 font-mono text-sm tracking-widest">{customer.memberNumber}</p>
        <div className="mt-4 flex items-end justify-between">
          <p className="font-ui text-sm">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="font-mono text-xs text-off-white/60">{customer.loyaltyPoints} pts</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        <Link href="/account/orders" className="border border-matte-black/10 p-6 hover:border-matte-black">
          <p className="font-mono text-xs uppercase text-concrete-grey">Orders</p>
          <p className="font-display text-3xl mt-2">{orderCount}</p>
        </Link>
        <Link href="/account/wishlist" className="border border-matte-black/10 p-6 hover:border-matte-black">
          <p className="font-mono text-xs uppercase text-concrete-grey">Wishlist</p>
          <p className="font-display text-3xl mt-2">{wishlistCount}</p>
        </Link>
        <Link href="/account/referrals" className="border border-matte-black/10 p-6 hover:border-matte-black">
          <p className="font-mono text-xs uppercase text-concrete-grey">Points</p>
          <p className="font-display text-3xl mt-2">{customer.loyaltyPoints}</p>
        </Link>
      </div>

      <h2 className="font-ui text-lg mb-4">Recent orders</h2>
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {recentOrders.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.orderNumber}`}
            className="flex justify-between px-4 py-3 font-mono text-xs hover:text-neon-accent"
          >
            <span>{o.orderNumber}</span>
            <span>{o.status}</span>
          </Link>
        ))}
        {recentOrders.length === 0 && (
          <p className="px-4 py-3 font-mono text-xs text-concrete-grey">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
