import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { ReferralLink } from "@/components/storefront/referral-link";

export const metadata = { title: "Referrals" };

const REWARD_POINTS = 100;

export default async function ReferralsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const referredCustomers = await db.customer.findMany({
    where: { referredByCustomerId: customer.id },
    select: { firstName: true, lastName: true, createdAt: true, referralRewardGranted: true },
    orderBy: { createdAt: "desc" },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const referralUrl = `${siteUrl}/account/register?ref=${customer.referralCode}`;

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Referrals</h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        Share your link — you earn {REWARD_POINTS} points the moment a friend you referred places their first order.
      </p>

      <ReferralLink url={referralUrl} />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="border border-matte-black/10 p-6">
          <p className="font-mono text-xs uppercase text-concrete-grey">Referred members</p>
          <p className="font-display text-3xl mt-2">{referredCustomers.length}</p>
        </div>
        <div className="border border-matte-black/10 p-6">
          <p className="font-mono text-xs uppercase text-concrete-grey">Your points</p>
          <p className="font-display text-3xl mt-2">{customer.loyaltyPoints}</p>
        </div>
      </div>

      <h2 className="font-ui text-lg mt-10 mb-4">Members you referred</h2>
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {referredCustomers.map((c, i) => (
          <div key={i} className="flex justify-between px-4 py-3 font-mono text-xs">
            <span>
              {c.firstName} {c.lastName?.charAt(0)}.
            </span>
            <span className={c.referralRewardGranted ? "text-neon-accent" : "text-concrete-grey"}>
              {c.referralRewardGranted ? "Reward earned" : "Awaiting first order"}
            </span>
          </div>
        ))}
        {referredCustomers.length === 0 && (
          <p className="px-4 py-6 font-mono text-xs text-concrete-grey">
            No referrals yet — share your link above.
          </p>
        )}
      </div>
    </div>
  );
}
