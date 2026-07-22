import Link from "next/link";
import { db } from "@/lib/db";
import { RaffleDrawControl } from "@/components/admin/raffle-draw-control";
import { NotifyWaitlistButton } from "@/components/admin/notify-waitlist-button";

export const metadata = { title: "Campaigns" };

export default async function AdminCampaignsPage() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { raffleEntries: true, waitlist: true, products: true } } },
  });

  const pendingRaffleCounts = await db.raffleEntry.groupBy({
    by: ["campaignId"],
    where: { selected: false },
    _count: { _all: true },
  });
  const pendingRaffleByCampaign = new Map(pendingRaffleCounts.map((p) => [p.campaignId, p._count._all]));

  const unnotifiedWaitlistCounts = await db.waitlistEntry.groupBy({
    by: ["campaignId"],
    where: { notified: false, campaignId: { not: null } },
    _count: { _all: true },
  });
  const unnotifiedByCampaign = new Map(
    unnotifiedWaitlistCounts.map((w) => [w.campaignId as string, w._count._all])
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Campaigns</h1>
        <Link
          href="/admin/campaigns/new"
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
        >
          New campaign
        </Link>
      </div>
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {campaigns.map((c) => (
          <div key={c.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/admin/campaigns/${c.id}`} className="font-ui text-sm hover:text-neon-accent">
                  {c.name}
                </Link>
                <p className="font-mono text-xs text-concrete-grey">
                  {c.status} · {c._count.products} products · {c._count.waitlist} waitlisted
                  {c.purchaseLimitPerCustomer && ` · limit ${c.purchaseLimitPerCustomer}/customer`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {c._count.waitlist > 0 && (
                  <NotifyWaitlistButton campaignId={c.id} waitlistCount={unnotifiedByCampaign.get(c.id) ?? 0} />
                )}
                {c.raffleMode && (
                  <div className="text-right">
                    <p className="font-mono text-xs text-concrete-grey mb-2">
                      {c._count.raffleEntries} entries · {pendingRaffleByCampaign.get(c.id) ?? 0} pending
                    </p>
                    <RaffleDrawControl campaignId={c.id} pendingEntries={pendingRaffleByCampaign.get(c.id) ?? 0} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="p-4 font-mono text-xs text-concrete-grey">No campaigns yet.</p>
        )}
      </div>
    </div>
  );
}
