import "server-only";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";

export type ActivePromotionInfo = {
  id: string;
  title: string | null;
  code: string | null;
  isAutomatic: boolean;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  scope: "ALL_PRODUCTS" | "PRODUCT_LINE" | "SPECIFIC_PRODUCTS";
  targetProductLine: string | null;
  targetProductIds: string[];
  value: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountPercent: number | null;
  minSpend: number | null;
};

export async function getActiveStorePromotions(): Promise<ActivePromotionInfo[]> {
  return cached("promotions:active", 30, async () => {
    const now = new Date();
    const promos = await db.discountCode.findMany({
      where: {
        active: true,
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: null },
          { startAt: null, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return promos.map((p) => ({
      id: p.id,
      title: p.title,
      code: p.code,
      isAutomatic: p.isAutomatic,
      type: p.type as any,
      scope: p.scope as any,
      targetProductLine: p.targetProductLine,
      targetProductIds: p.targetProductIds,
      value: Number(p.value),
      buyQuantity: p.buyQuantity,
      getQuantity: p.getQuantity,
      getDiscountPercent: p.getDiscountPercent ? Number(p.getDiscountPercent) : null,
      minSpend: p.minSpend ? Number(p.minSpend) : null,
    }));
  });
}

export function getProductPromotionBadge(
  product: { id: string; line: string; basePrice: number },
  promotions: ActivePromotionInfo[]
): {
  badge: string | null;
  discountedPrice: number | null;
  promotionTitle: string | null;
  isAutomatic: boolean;
} {
  // Find applicable promotions (prioritize automatic promotions)
  const applicable = promotions.filter((p) => {
    if (p.scope === "ALL_PRODUCTS") return true;
    if (p.scope === "PRODUCT_LINE" && p.targetProductLine?.toUpperCase() === product.line.toUpperCase()) return true;
    if (p.scope === "SPECIFIC_PRODUCTS" && p.targetProductIds.includes(product.id)) return true;
    return false;
  });

  if (applicable.length === 0) {
    return { badge: null, discountedPrice: null, promotionTitle: null, isAutomatic: false };
  }

  // Prioritize automatic promotion if present
  const best = applicable.find((p) => p.isAutomatic) || applicable[0];
  let badge: string | null = null;
  let discountedPrice: number | null = null;

  if (best.type === "PERCENTAGE") {
    badge = `${best.value}% OFF`;
    discountedPrice = Math.round(product.basePrice * (1 - best.value / 100));
  } else if (best.type === "FIXED") {
    badge = `${best.value} EGP OFF`;
    discountedPrice = Math.max(0, product.basePrice - best.value);
  } else if (best.type === "BUY_X_GET_Y") {
    badge = `BUY ${best.buyQuantity} GET ${best.getQuantity}`;
  } else if (best.type === "FREE_SHIPPING") {
    badge = `FREE SHIPPING`;
  }

  return {
    badge,
    discountedPrice,
    promotionTitle: best.title || (best.code ? `CODE: ${best.code}` : "SPECIAL OFFER"),
    isAutomatic: best.isAutomatic,
  };
}
