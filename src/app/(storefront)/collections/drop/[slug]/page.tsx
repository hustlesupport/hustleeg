import { notFound } from "next/navigation";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { hasEarlyAccess } from "@/lib/loyalty";
import { ProductCard } from "@/components/storefront/product-card";
import { WaitlistForm } from "@/components/storefront/waitlist-form";
import { RaffleForm } from "@/components/storefront/raffle-form";
import { Countdown } from "@/components/storefront/countdown";
import { checkAdmission, isLaunchWindowActive } from "@/lib/queue";
import { getLocale } from "@/lib/locale-cookie";
import { pickLocalized } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  return { title: campaign?.name ?? "Drop" };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [campaign, customer, locale] = await Promise.all([
    getCampaignBySlug(slug),
    getCurrentCustomer(),
    getLocale(),
  ]);
  if (!campaign) notFound();

  const displayName = pickLocalized(campaign.name, campaign.nameAr, locale);
  const displayStory = pickLocalized(campaign.story ?? "", campaign.storyAr, locale);

  if (campaign.status === "LIVE" && isLaunchWindowActive(campaign.startAt)) {
    const admitted = await checkAdmission(campaign.id);
    if (!admitted) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center bg-matte-black px-6 text-center text-off-white">
          <meta httpEquiv="refresh" content="3" />
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-4">High demand</p>
          <h1 className="font-display text-3xl mb-4">{displayName} is live</h1>
          <p className="font-ui text-sm text-off-white/70">
            Traffic is heavy right now — this page refreshes automatically, hang tight.
          </p>
        </div>
      );
    }
  }

  const publiclyLive = campaign.status === "LIVE" || campaign.status === "ARCHIVED" || campaign.status === "ENDED";
  const earlyAccess = !publiclyLive && hasEarlyAccess(campaign, customer);
  const canShopNow = publiclyLive || earlyAccess;

  const products = canShopNow
    ? campaign.products.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
        totalStock: p.variants.reduce(
          (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
          0
        ),
      }))
    : [];

  return (
    <div>
      <section className="bg-matte-black px-6 py-24 text-off-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-4">
            {earlyAccess ? "Early access" : campaign.status === "LIVE" ? "Live now" : campaign.status}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl">{displayName}</h1>
          {displayStory && <p className="mt-6 font-ui text-lg text-off-white/80">{displayStory}</p>}

          {!canShopNow && campaign.startAt && (
            <div className="mt-8 flex flex-col items-center gap-6">
              <Countdown target={campaign.startAt} />
              {campaign.earlyAccessTier && !customer && (
                <p className="font-mono text-xs text-off-white/60">
                  {campaign.earlyAccessTier} members get early access —{" "}
                  <a href="/account/login" className="underline">
                    sign in
                  </a>
                  .
                </p>
              )}
              <div className="w-full max-w-sm">
                {campaign.raffleMode ? (
                  <RaffleForm campaignId={campaign.id} defaultEmail={customer?.email} />
                ) : (
                  <WaitlistForm campaignId={campaign.id} />
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        {canShopNow && campaign.purchaseLimitPerCustomer && (
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-neon-accent">
            Limit {campaign.purchaseLimitPerCustomer} per customer
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {canShopNow && products.length === 0 && (
            <p className="col-span-full font-mono text-sm text-concrete-grey">
              Products for this drop go live soon.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
