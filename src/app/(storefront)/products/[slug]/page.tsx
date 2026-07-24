import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { formatMoney } from "@/lib/format";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ReviewForm } from "@/components/storefront/review-form";
import { ProductCard } from "@/components/storefront/product-card";
import { RecentlyViewedTracker } from "@/components/storefront/recently-viewed-tracker";
import { AnalyticsTracker } from "@/components/storefront/analytics-tracker";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getRecentlyViewedProducts } from "@/lib/recently-viewed";
import { getLocale } from "@/lib/locale-cookie";
import { pickLocalized } from "@/lib/i18n";
import { db } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";
import type { Metadata } from "next";

// No `revalidate` export here — this page reads the customer session
// (wishlist heart state), which makes it inherently per-request. The
// underlying product/campaign queries still hit the Redis cache-aside layer
// in src/lib/queries, so we don't lose the DB-query speedup, just the outer
// HTML caching.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, customer, recentlyViewed, locale] = await Promise.all([
    getRelatedProducts(product.id, product.line, 4),
    getCurrentCustomer(),
    getRecentlyViewedProducts(slug),
    getLocale(),
  ]);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const displayName = pickLocalized(product.name, product.nameAr, locale);
  const displayDescription = pickLocalized(product.description ?? "", product.descriptionAr, locale);
  const displayStory = pickLocalized(product.story ?? "", product.storyAr, locale);

  const [wishlisted, existingReview] = customer
    ? await Promise.all([
        db.wishlistItem.findUnique({
          where: { customerId_productId: { customerId: customer.id, productId: product.id } },
        }),
        db.review.findFirst({ where: { productId: product.id, customerId: customer.id } }),
      ])
    : [null, null];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <RecentlyViewedTracker slug={product.slug} />
      <AnalyticsTracker type="PRODUCT_VIEW" productId={product.id} />
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Five-shot gallery */}
        <div className="grid grid-cols-2 gap-2">
          {product.images.map((image, i) => (
            <div
              key={image.id}
              className={`relative aspect-[4/5] bg-concrete-grey/15 ${i === 0 ? "col-span-2" : ""}`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? displayName}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
          {product.images.length === 0 && (
            <div className="col-span-2 aspect-[4/5] bg-concrete-grey/15" />
          )}
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.campaign && (
            <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">
              {product.campaign.name}
            </p>
          )}
          <h1 className="font-display text-3xl">{displayName}</h1>
          <p className="font-mono text-xl mt-2">{formatMoney(product.basePrice, product.currency)}</p>

          {totalStock > 0 && totalStock <= 10 && (
            <p className="font-mono text-xs text-neon-accent mt-2">{totalStock} left across all sizes</p>
          )}

          {displayDescription && (
            <div
              className="prose-content mt-6 font-ui text-sm leading-relaxed text-matte-black/80"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayDescription) }}
            />
          )}

          <div className="mt-8 space-y-3">
            <AddToCart
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock }))}
              productId={product.id}
              defaultEmail={customer?.email}
            />
            <WishlistButton productId={product.id} initialWishlisted={Boolean(wishlisted)} signedIn={Boolean(customer)} />
          </div>

          {(product.fabric || product.care || product.sizeChartUrl) && (
            <div className="mt-8 border-t border-matte-black/10 pt-6 font-mono text-xs text-concrete-grey space-y-2">
              {product.fabric && <p>Fabric: {product.fabric}</p>}
              {product.care && <p>Care: {product.care}</p>}
              {product.sizeChartUrl && (
                <details className="group">
                  <summary className="cursor-pointer uppercase tracking-widest text-matte-black hover:text-neon-accent">
                    Size guide
                  </summary>
                  <div className="relative mt-3 aspect-square w-full max-w-sm bg-concrete-grey/15">
                    <Image
                      src={product.sizeChartUrl}
                      alt="Size chart"
                      fill
                      sizes="(min-width: 1024px) 24rem, 100vw"
                      className="object-contain"
                    />
                  </div>
                </details>
              )}
            </div>
          )}

          {displayStory && (
            <div className="mt-6 border-t border-matte-black/10 pt-6">
              <div
                className="prose-content font-ui text-sm italic text-matte-black/70"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayStory) }}
              />
            </div>
          )}

          <div className="mt-10 border-t border-matte-black/10 pt-6">
            <h2 className="font-display text-lg mb-4">Reviews</h2>
            {product.reviews.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.reviews.map((r) => (
                  <div key={r.id} className="font-ui text-sm">
                    <p className="font-mono text-xs text-neon-accent">{"★".repeat(r.rating)}</p>
                    {r.title && <p className="font-semibold mt-1">{r.title}</p>}
                    {r.body && <p className="text-matte-black/70">{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
            <ReviewForm
              productId={product.id}
              productSlug={product.slug}
              signedIn={Boolean(customer)}
              alreadyReviewed={Boolean(existingReview)}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl mb-8">Complete the Fit</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl mb-8">Recently Viewed</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
