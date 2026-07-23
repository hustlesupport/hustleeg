import Link from "next/link";
import Image from "next/image";
import { getLiveCampaign, getUpcomingCampaign } from "@/lib/queries/campaigns";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/storefront/product-card";
import { Countdown } from "@/components/storefront/countdown";

export const revalidate = 60;

export default async function HomePage() {
  const [liveCampaign, upcomingCampaign, featured] = await Promise.all([
    getLiveCampaign(),
    getUpcomingCampaign(),
    getFeaturedProducts(8),
  ]);

  const hero = liveCampaign ?? upcomingCampaign;

  return (
    <div>
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
            {/* Real lookbook photography, crossfading — replaces the earlier
                empty-environment placeholder banners entirely. */}
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
            {/* Darkening + bottom scrim so the ticker/wordmark/CTA stay legible
                over photo content, whatever it happens to show at the moment. */}
            <div className="absolute inset-0 bg-matte-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-matte-black via-matte-black/50 to-transparent" />
            {/* Kinetic ticker for constant motion even where the photo is calm. */}
            <div className="relative z-10 overflow-hidden border-b border-matte-black/10 bg-neon-accent py-2">
              <div className="ticker flex w-max whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest text-matte-black">
                {Array.from({ length: 2 }).map((_, i) => (
                  <span key={i} className="px-4" aria-hidden={i === 1}>
                    New drops weekly • Limited runs • Cairo, Egypt • Built to control everything •
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-6 pb-16">
          {upcomingCampaign && (
            <div className="mb-4">
              <Countdown target={upcomingCampaign.startAt ?? new Date()} />
            </div>
          )}
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">
            {liveCampaign ? "Live now" : upcomingCampaign ? "Coming soon" : "Hustle"}
          </p>
          <h1
            className={
              hero
                ? "font-display text-5xl sm:text-7xl"
                : "hustle-pulse font-display text-[20vw] leading-[0.85] sm:text-[9rem]"
            }
          >
            {hero?.name ?? "HUSTLE"}
          </h1>
          {hero?.tagline && <p className="mt-4 max-w-lg font-ui text-lg">{hero.tagline}</p>}
          {hero ? (
            <Link
              href={`/collections/drop/${hero.slug}`}
              className="cta-glow mt-8 inline-block self-start bg-neon-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-matte-black hover:opacity-90"
            >
              Shop the drop
            </Link>
          ) : (
            <Link
              href="/collections/essentials"
              className="cta-glow mt-8 inline-block self-start bg-neon-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-matte-black hover:opacity-90"
            >
              Shop now
            </Link>
          )}
        </div>
      </section>

      {/* Featured / new arrivals */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">New Arrivals</h2>
          <Link href="/collections/essentials" className="font-mono text-xs uppercase tracking-widest hover:text-neon-accent">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {featured.length === 0 && (
            <p className="col-span-full font-mono text-sm text-concrete-grey">
              No products published yet — add some from the admin.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
