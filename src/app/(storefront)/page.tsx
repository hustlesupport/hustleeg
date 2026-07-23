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
      <section className="relative flex h-[85dvh] min-h-[520px] items-end overflow-hidden bg-matte-black text-off-white">
        {hero?.heroImageUrl ? (
          <Image
            src={hero.heroImageUrl}
            alt={hero.name}
            fill
            priority
            className="object-cover opacity-70"
          />
        ) : (
          <>
            {["/banner1.png", "/banner2.png", "/banner3.png"].map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                priority
                className="hero-banner absolute inset-0 object-cover"
                style={{ animationDelay: `${i * -4}s` }}
              />
            ))}
          </>
        )}
        <Image
          src="/brandMark.png"
          alt=""
          width={1080}
          height={1350}
          priority
          className="pointer-events-none absolute -right-16 -top-24 z-[5] h-[130%] w-auto max-w-none select-none opacity-[0.07] sm:-right-10"
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16">
          {upcomingCampaign && (
            <div className="mb-4">
              <Countdown target={upcomingCampaign.startAt ?? new Date()} />
            </div>
          )}
          <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">
            {liveCampaign ? "Live now" : upcomingCampaign ? "Coming soon" : "Hustle"}
          </p>
          <h1 className="font-display text-5xl sm:text-7xl">{hero?.name ?? "HUSTLE"}</h1>
          {hero?.tagline && <p className="mt-4 max-w-lg font-ui text-lg">{hero.tagline}</p>}
          {hero && (
            <Link
              href={`/collections/drop/${hero.slug}`}
              className="mt-8 inline-block bg-neon-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-matte-black hover:opacity-90"
            >
              Shop the drop
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
