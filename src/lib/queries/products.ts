import "server-only";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";
import type { ProductLine } from "@/generated/prisma/enums";

const productCard = {
  id: true,
  name: true,
  slug: true,
  line: true,
  basePrice: true,
  currency: true,
  images: { orderBy: { position: "asc" as const }, take: 2 },
  variants: { select: { id: true, size: true, color: true, inventory: { select: { quantity: true } } } },
} as const;

export type ProductCard = Awaited<ReturnType<typeof getFeaturedProducts>>[number];

function withStock<T extends { variants: { inventory: { quantity: number }[] }[] }>(product: T) {
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
    0
  );
  return { ...product, totalStock, basePrice: Number((product as unknown as { basePrice: unknown }).basePrice) };
}

export async function getFeaturedProducts(limit = 8) {
  return cached(`products:featured:${limit}`, 60, async () => {
    const products = await db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: productCard,
    });
    return products.map(withStock);
  });
}

export async function getAllProducts() {
  return cached("products:all", 60, async () => {
    const products = await db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: productCard,
    });
    return products.map(withStock);
  });
}

export async function getProductsByLine(line: ProductLine) {
  return cached(`products:line:${line}`, 60, async () => {
    const products = await db.product.findMany({
      where: { status: "ACTIVE", line },
      orderBy: { createdAt: "desc" },
      select: productCard,
    });
    return products.map(withStock);
  });
}

export async function getProductBySlug(slug: string) {
  return cached(`product:${slug}`, 60, async () => {
    const product = await db.product.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { include: { inventory: true } },
        campaign: true,
        reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!product) return null;
    return {
      ...product,
      basePrice: Number(product.basePrice),
      variants: product.variants.map((v) => ({
        ...v,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
        stock: v.inventory.reduce((s, i) => s + i.quantity, 0),
      })),
    };
  });
}

export async function getRelatedProducts(productId: string, line: ProductLine, limit = 4) {
  return cached(`products:related:${productId}`, 120, async () => {
    const products = await db.product.findMany({
      where: { status: "ACTIVE", line, id: { not: productId } },
      take: limit,
      select: productCard,
    });
    return products.map(withStock);
  });
}

export async function getPopularProducts(limit = 5) {
  // We can't cache this as easily with the current `cached` implementation 
  // because we depend on two dynamic data sources, but for now we'll cache for 60s
  return cached(`products:popular:${limit}`, 60, async () => {
    // We dynamically import to avoid any potential circular dependencies,
    // though it shouldn't be an issue here.
    const { getProductEngagementStats } = await import("./analytics");
    const stats = await getProductEngagementStats();
    
    // Calculate a popularity score for all products that have stats
    const scores = Object.entries(stats).map(([id, s]) => ({
      id,
      score: s.views * 1 + s.carts * 3 + s.purchases * 5
    })).sort((a, b) => b.score - a.score);

    // If no stats yet, just fallback to newest active products
    if (scores.length === 0) {
      const products = await db.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: productCard,
      });
      return products.map(withStock);
    }

    const topProductIds = scores.slice(0, limit).map(s => s.id);
    
    // Fetch the actual products
    const products = await db.product.findMany({
      where: { id: { in: topProductIds }, status: "ACTIVE" },
      select: productCard,
    });

    // Sort them in the exact order of topProductIds
    const sortedProducts = topProductIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // If we didn't get enough products (e.g. only 2 products have stats),
    // fill the rest with newest products
    if (sortedProducts.length < limit) {
      const existingIds = new Set(sortedProducts.map(p => p.id));
      const fillProducts = await db.product.findMany({
        where: { status: "ACTIVE", id: { notIn: Array.from(existingIds) } },
        orderBy: { createdAt: "desc" },
        take: limit - sortedProducts.length,
        select: productCard,
      });
      sortedProducts.push(...fillProducts);
    }

    return sortedProducts.map(withStock);
  });
}
