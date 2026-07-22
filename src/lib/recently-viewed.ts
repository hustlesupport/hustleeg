import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "hustle_recently_viewed";

export async function getRecentlyViewedProducts(excludeSlug?: string, limit = 4) {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return [];

  let slugs: string[];
  try {
    slugs = JSON.parse(raw);
  } catch {
    return [];
  }

  const filtered = slugs.filter((s) => s !== excludeSlug).slice(0, limit);
  if (filtered.length === 0) return [];

  const products = await db.product.findMany({
    where: { slug: { in: filtered }, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      currency: true,
      images: { orderBy: { position: "asc" }, take: 2 },
      variants: { select: { inventory: { select: { quantity: true } } } },
    },
  });

  // Preserve most-recently-viewed-first order (findMany doesn't).
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return filtered
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      totalStock: p.variants.reduce((sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0), 0),
    }));
}
