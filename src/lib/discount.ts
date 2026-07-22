export type DiscountCodeLike = {
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSpend: number | null;
};

export function isDiscountEligible(discount: DiscountCodeLike, subtotal: number) {
  return !discount.minSpend || subtotal >= discount.minSpend;
}

/** Amount knocked off the subtotal — FREE_SHIPPING returns 0 here, see zeroesShipping(). */
export function computeDiscountAmount(discount: DiscountCodeLike, subtotal: number): number {
  if (!isDiscountEligible(discount, subtotal)) return 0;
  if (discount.type === "PERCENTAGE") return Math.round(subtotal * (discount.value / 100));
  if (discount.type === "FIXED") return Math.min(discount.value, subtotal);
  return 0;
}

export function zeroesShipping(discount: DiscountCodeLike) {
  return discount.type === "FREE_SHIPPING";
}
