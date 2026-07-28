import Link from "next/link";
import Image from "next/image";
import { getLiveCampaign, getUpcomingCampaign } from "@/lib/queries/campaigns";
import { getPopularProducts } from "@/lib/queries/products";
import { getActiveStorePromotions, getProductPromotionBadge } from "@/lib/queries/promotions";
import { ProductCard } from "@/components/storefront/product-card";
import { Countdown } from "@/components/storefront/countdown";

export const revalidate = 30;

export default async function HomePage() {
  const [liveCampaign, upcomingCampaign, popular, activePromotions] = await Promise.all([
    getLiveCampaign(),
    getUpcomingCampaign(),
    getPopularProducts(5),
    getActiveStorePromotions().catch(() => []),
  ]);

  const hero = liveCampaign ?? upcomingCampaign;
  const topAutoPromo = activePromotions.find((p) => p.isAutomatic) || activePromotions[0];

  return (
    <div>
      {/* Active Promotion Announcement Bar */}
      {topAutoPromo && (
        <div className="bg-neon-accent text-matte-black py-2.5 px-4 text-center font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b border-matte-black">
          <span>🔥</span>
          <span>
            {topAutoPromo.title || "SPECIAL PROMOTION"}:{" "}
            {topAutoPromo.type === "PERCENTAGE"
              ? `${topAutoPromo.value}% OFF`
              : topAutoPromo.type === "FIXED"
              ? `${topAutoPromo.value} EGP OFF`
              : topAutoPromo.type === "BUY_X_GET_Y"
              ? `BUY ${topAutoPromo.buyQuantity} GET ${topAutoPromo.getQuantity}`
              : "FREE SHIPPING"}
            {topAutoPromo.scope === "PRODUCT_LINE" ? ` ON ${topAutoPromo.targetProductLine}` : ""}
          </span>
          <span className="hidden sm:inline opacity-75 font-normal text-[10px]">
            {topAutoPromo.isAutomatic ? "(Applied automatically in bag)" : `(Use code ${topAutoPromo.code})`}
          </span>
        </div>
      )}

      {/* Hero tied to the active campaign, not "Home" */}
      <section className="relative flex h-[85dvh] min-h-[520px] flex-col overflow-hidden bg-matte-black text-off-white">
        {hero?.heroImageUrl && (
          <Image
            src={hero.heroImageUrl}
            alt={hero.name}
            fill
            priority
            className="object-cover opacity-70"
          />
        )}
        {!hero && (
          <>
            {/* Real lookbook photography, crossfading */}
            {["/23.png", "/24.png", "/32.png", "/33.png"].map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                priority
                sizes="100vw"
                className="hero-photo absolute inset-0 object-cover object-top"
                style={{ animationDelay: `${i * -4}s` }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-matte-black via-matte-black/40 to-transparent" />
          </>
        )}

        <div className="relative z-10 my-auto mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">
            {liveCampaign ? "Active Collection Drop" : upcomingCampaign ? "Next Drop Coming Soon" : "Streetwear Collection"}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-tight">
            {hero?.name ?? "HUSTLE CULT"}
          </h1>
          <p className="mt-4 font-mono text-sm max-w-lg mx-auto text-off-white/80">
            {hero?.tagline ?? "High-grade essentials & raw graffiti streetwear."}
          </p>

          {upcomingCampaign?.startAt && !liveCampaign && (
            <div className="mt-8">
              <p className="font-mono text-xs text-concrete-grey uppercase mb-2">Drop Countdown</p>
              <Countdown target={upcomingCampaign.startAt} />
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/products"
              className="bg-neon-accent px-8 py-4 font-mono text-xs uppercase tracking-widest text-matte-black hover:bg-off-white transition-colors"
            >
              Shop Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Featured / Popular Products Grid */}
      <section className="py-20 bg-off-white">
        <div className="mx-auto max-w-7xl px-6 mb-12 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase">Popular Right Now</h2>
            <p className="font-mono text-xs text-concrete-grey">Curated trending streetwear pieces</p>
          </div>
          <Link href="/products" className="font-mono text-xs uppercase tracking-widest hover:text-neon-accent transition-colors">
            View all
          </Link>
        </div>
        {popular.length === 0 ? (
          <p className="mx-auto max-w-7xl px-6 font-mono text-sm text-concrete-grey">
            No products published yet.
          </p>
        ) : (
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {popular.map((product) => (
                <div key={product.id} className="w-[85vw] sm:w-[340px] shrink-0 snap-start">
                  <ProductCard
                    product={product}
                    promotion={getProductPromotionBadge({ id: product.id, line: product.line, basePrice: product.basePrice }, activePromotions)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
