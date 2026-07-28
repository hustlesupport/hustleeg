"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCart } from "@/lib/cart-session";
import { getAppliedDiscountCode, setAppliedDiscountCode, clearAppliedDiscountCode } from "@/lib/discount-session";
import {
  evaluatePromotionsAndDiscounts,
  isDiscountEligible,
  computeDiscountAmount,
  zeroesShipping,
  type CartItemForDiscount,
  type PromotionRule,
  type AppliedPromotionDetail,
  type DiscountType,
} from "@/lib/discount";

export type AppliedDiscount = {
  code: string;
  type: DiscountType;
  amount: number;
  freeShipping: boolean;
  automaticDiscountAmount?: number;
  promoCodeDiscountAmount?: number;
  appliedPromotions?: AppliedPromotionDetail[];
};

async function loadDiscount(code: string): Promise<PromotionRule> {
  const discount = await db.discountCode.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      active: true,
    },
  });
  if (!discount) throw new Error("Invalid or inactive promo code.");

  const now = new Date();
  if (discount.startAt && now < discount.startAt) throw new Error("This promo code isn't active yet.");
  if (discount.endAt && now > discount.endAt) throw new Error("This promo code has expired.");
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    throw new Error("This promo code has reached its usage limit.");
  }

  return {
    id: discount.id,
    title: discount.title,
    code: discount.code,
    isAutomatic: discount.isAutomatic,
    type: discount.type as DiscountType,
    scope: discount.scope as any,
    targetProductLine: discount.targetProductLine,
    targetProductIds: discount.targetProductIds,
    value: Number(discount.value),
    buyQuantity: discount.buyQuantity,
    getQuantity: discount.getQuantity,
    getDiscountPercent: discount.getDiscountPercent ? Number(discount.getDiscountPercent) : null,
    minSpend: discount.minSpend ? Number(discount.minSpend) : null,
    usageLimit: discount.usageLimit,
    usedCount: discount.usedCount,
    startAt: discount.startAt,
    endAt: discount.endAt,
    active: discount.active,
  };
}

async function loadAutomaticPromotions(): Promise<PromotionRule[]> {
  const now = new Date();
  const promos = await db.discountCode.findMany({
    where: {
      isAutomatic: true,
      active: true,
      OR: [
        { startAt: null, endAt: null },
        { startAt: { lte: now }, endAt: null },
        { startAt: null, endAt: { gte: now } },
        { startAt: { lte: now }, endAt: { gte: now } },
      ],
    },
  });

  return promos.map((p) => ({
    id: p.id,
    title: p.title,
    code: p.code,
    isAutomatic: true,
    type: p.type as DiscountType,
    scope: p.scope as any,
    targetProductLine: p.targetProductLine,
    targetProductIds: p.targetProductIds,
    value: Number(p.value),
    buyQuantity: p.buyQuantity,
    getQuantity: p.getQuantity,
    getDiscountPercent: p.getDiscountPercent ? Number(p.getDiscountPercent) : null,
    minSpend: p.minSpend ? Number(p.minSpend) : null,
    usageLimit: p.usageLimit,
    usedCount: p.usedCount,
    startAt: p.startAt,
    endAt: p.endAt,
    active: p.active,
  }));
}

export async function applyDiscountCodeAction(code: string): Promise<AppliedDiscount> {
  const parsed = z.string().min(2).max(40).parse(code).toUpperCase();
  const promoRule = await loadDiscount(parsed);

  const cart = await getCart();
  const cartItems: CartItemForDiscount[] =
    cart?.items.map((i) => ({
      productId: i.variant.product.id,
      productLine: i.variant.product.line,
      unitPrice: Number(i.priceAtAdd),
      quantity: i.quantity,
      title: i.variant.product.name,
    })) ?? [];

  const automaticPromos = await loadAutomaticPromotions();
  const evalResult = evaluatePromotionsAndDiscounts(cartItems, automaticPromos, promoRule);

  if (promoRule.minSpend && evalResult.subtotal < promoRule.minSpend) {
    throw new Error(`Minimum spend of ${promoRule.minSpend} EGP required for code ${parsed}.`);
  }

  await setAppliedDiscountCode(parsed);

  return {
    code: parsed,
    type: promoRule.type,
    amount: evalResult.totalDiscountAmount,
    freeShipping: evalResult.freeShipping,
    automaticDiscountAmount: evalResult.automaticDiscountAmount,
    promoCodeDiscountAmount: evalResult.promoCodeDiscountAmount,
    appliedPromotions: evalResult.appliedPromotions,
  };
}

export async function removeDiscountCodeAction() {
  await clearAppliedDiscountCode();
}

export async function getAppliedDiscountAction(): Promise<AppliedDiscount | null> {
  const code = await getAppliedDiscountCode();
  const cart = await getCart();
  const cartItems: CartItemForDiscount[] =
    cart?.items.map((i) => ({
      productId: i.variant.product.id,
      productLine: i.variant.product.line,
      unitPrice: Number(i.priceAtAdd),
      quantity: i.quantity,
      title: i.variant.product.name,
    })) ?? [];

  const automaticPromos = await loadAutomaticPromotions();

  let promoRule: PromotionRule | null = null;
  if (code) {
    try {
      promoRule = await loadDiscount(code);
    } catch {
      await clearAppliedDiscountCode();
    }
  }

  const evalResult = evaluatePromotionsAndDiscounts(cartItems, automaticPromos, promoRule);

  if (evalResult.totalDiscountAmount === 0 && !evalResult.freeShipping && !code) {
    return null;
  }

  return {
    code: code || (automaticPromos.length > 0 ? "AUTO_PROMO" : ""),
    type: promoRule?.type || "PERCENTAGE",
    amount: evalResult.totalDiscountAmount,
    freeShipping: evalResult.freeShipping,
    automaticDiscountAmount: evalResult.automaticDiscountAmount,
    promoCodeDiscountAmount: evalResult.promoCodeDiscountAmount,
    appliedPromotions: evalResult.appliedPromotions,
  };
}
