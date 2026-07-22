"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCart } from "@/lib/cart-session";
import { getAppliedDiscountCode, setAppliedDiscountCode, clearAppliedDiscountCode } from "@/lib/discount-session";
import { computeDiscountAmount, isDiscountEligible, zeroesShipping } from "@/lib/discount";

export type AppliedDiscount = {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  amount: number;
  freeShipping: boolean;
};

async function loadDiscount(code: string) {
  const discount = await db.discountCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!discount || !discount.active) throw new Error("Invalid promo code.");
  const now = new Date();
  if (discount.startAt && now < discount.startAt) throw new Error("This code isn't active yet.");
  if (discount.endAt && now > discount.endAt) throw new Error("This code has expired.");
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    throw new Error("This code has reached its usage limit.");
  }
  return discount;
}

export async function applyDiscountCodeAction(code: string): Promise<AppliedDiscount> {
  const parsed = z.string().min(2).max(40).parse(code).toUpperCase();
  const discount = await loadDiscount(parsed);

  const cart = await getCart();
  const subtotal = cart?.items.reduce((sum, i) => sum + Number(i.priceAtAdd) * i.quantity, 0) ?? 0;

  const discountLike = { type: discount.type, value: Number(discount.value), minSpend: discount.minSpend ? Number(discount.minSpend) : null };
  if (!isDiscountEligible(discountLike, subtotal)) {
    throw new Error(`Minimum spend of ${discount.minSpend} required for this code.`);
  }

  await setAppliedDiscountCode(parsed);

  return {
    code: parsed,
    type: discount.type,
    amount: computeDiscountAmount(discountLike, subtotal),
    freeShipping: zeroesShipping(discountLike),
  };
}

export async function removeDiscountCodeAction() {
  await clearAppliedDiscountCode();
}

export async function getAppliedDiscountAction(): Promise<AppliedDiscount | null> {
  const code = await getAppliedDiscountCode();
  if (!code) return null;

  try {
    const discount = await loadDiscount(code);
    const cart = await getCart();
    const subtotal = cart?.items.reduce((sum, i) => sum + Number(i.priceAtAdd) * i.quantity, 0) ?? 0;
    const discountLike = { type: discount.type, value: Number(discount.value), minSpend: discount.minSpend ? Number(discount.minSpend) : null };

    return {
      code,
      type: discount.type,
      amount: computeDiscountAmount(discountLike, subtotal),
      freeShipping: zeroesShipping(discountLike),
    };
  } catch {
    // Code became invalid (expired, deactivated) since it was applied.
    await clearAppliedDiscountCode();
    return null;
  }
}
