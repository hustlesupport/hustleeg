export type PromotionScope = "ALL_PRODUCTS" | "PRODUCT_LINE" | "SPECIFIC_PRODUCTS";
export type DiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";

export type DiscountCodeLike = {
  type: DiscountType;
  value: number;
  minSpend?: number | null;
  isAutomatic?: boolean;
  scope?: PromotionScope;
  targetProductLine?: string | null;
  targetProductIds?: string[];
  buyQuantity?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
};

export type CartItemForDiscount = {
  productId: string;
  productLine: string;
  unitPrice: number;
  quantity: number;
  title?: string;
};

export type PromotionRule = {
  id: string;
  title?: string | null;
  code?: string | null;
  isAutomatic: boolean;
  type: DiscountType;
  scope: PromotionScope;
  targetProductLine?: string | null;
  targetProductIds?: string[];
  value: number;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
  minSpend?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  active?: boolean;
};

export type AppliedPromotionDetail = {
  promotionId: string;
  title: string;
  code?: string | null;
  isAutomatic: boolean;
  type: DiscountType;
  discountAmount: number;
  description: string;
};

export type PromotionEvaluationResult = {
  subtotal: number;
  automaticDiscountAmount: number;
  promoCodeDiscountAmount: number;
  totalDiscountAmount: number;
  freeShipping: boolean;
  appliedPromotions: AppliedPromotionDetail[];
  finalSubtotal: number;
};

// Legacy helper compatibility
export function isDiscountEligible(discount: DiscountCodeLike, subtotal: number): boolean {
  return !discount.minSpend || subtotal >= discount.minSpend;
}

export function computeDiscountAmount(discount: DiscountCodeLike, subtotal: number): number {
  if (!isDiscountEligible(discount, subtotal)) return 0;
  if (discount.type === "PERCENTAGE") return Math.round(subtotal * (discount.value / 100));
  if (discount.type === "FIXED") return Math.min(discount.value, subtotal);
  return 0;
}

export function zeroesShipping(discount: DiscountCodeLike): boolean {
  return discount.type === "FREE_SHIPPING";
}

/**
 * Checks if a cart item matches a promotion's scope requirements.
 */
export function isItemInScope(item: CartItemForDiscount, scope: PromotionScope, targetLine?: string | null, targetProductIds?: string[]): boolean {
  if (scope === "ALL_PRODUCTS") return true;
  if (scope === "PRODUCT_LINE") {
    return !!targetLine && item.productLine.toUpperCase() === targetLine.toUpperCase();
  }
  if (scope === "SPECIFIC_PRODUCTS") {
    return Array.isArray(targetProductIds) && targetProductIds.includes(item.productId);
  }
  return true;
}

/**
 * Calculates BOGO (Buy X Get Y) savings for a given promotion rule on cart items.
 */
export function calculateBogoDiscount(rule: PromotionRule, items: CartItemForDiscount[]): number {
  const buyQty = rule.buyQuantity || 1;
  const getQty = rule.getQuantity || 1;
  const discountPct = (rule.getDiscountPercent ?? 100) / 100;
  const setSize = buyQty + getQty;

  // Filter matching units
  const matchingUnits: number[] = [];
  for (const item of items) {
    if (isItemInScope(item, rule.scope, rule.targetProductLine, rule.targetProductIds)) {
      for (let i = 0; i < item.quantity; i++) {
        matchingUnits.push(item.unitPrice);
      }
    }
  }

  if (matchingUnits.length < setSize) return 0;

  // Sort prices ascending so customer gets discount on cheaper items in the bundle (standard e-commerce practice)
  matchingUnits.sort((a, b) => a - b);

  const totalSets = Math.floor(matchingUnits.length / setSize);
  let discountTotal = 0;

  // Take getQty cheapest items per completed set
  for (let s = 0; s < totalSets; s++) {
    for (let g = 0; g < getQty; g++) {
      const price = matchingUnits[s * getQty + g];
      discountTotal += Math.round(price * discountPct);
    }
  }

  return discountTotal;
}

/**
 * Calculates discount amount for standard PERCENTAGE, FIXED, FREE_SHIPPING or BOGO rules.
 */
export function calculateRuleDiscount(rule: PromotionRule, items: CartItemForDiscount[], cartSubtotal: number): { amount: number; freeShipping: boolean } {
  // Check active dates & min spend
  const now = new Date();
  if (rule.startAt && new Date(rule.startAt) > now) return { amount: 0, freeShipping: false };
  if (rule.endAt && new Date(rule.endAt) < now) return { amount: 0, freeShipping: false };
  if (rule.minSpend && cartSubtotal < rule.minSpend) return { amount: 0, freeShipping: false };

  if (rule.type === "FREE_SHIPPING") {
    return { amount: 0, freeShipping: true };
  }

  if (rule.type === "BUY_X_GET_Y") {
    const bogoAmount = calculateBogoDiscount(rule, items);
    return { amount: bogoAmount, freeShipping: false };
  }

  // Filter items matching scope
  const qualifyingItems = items.filter(i => isItemInScope(i, rule.scope, rule.targetProductLine, rule.targetProductIds));
  const qualifyingSubtotal = qualifyingItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  if (qualifyingSubtotal <= 0) return { amount: 0, freeShipping: false };

  if (rule.type === "PERCENTAGE") {
    const amount = Math.round(qualifyingSubtotal * (Number(rule.value) / 100));
    return { amount: Math.min(amount, qualifyingSubtotal), freeShipping: false };
  }

  if (rule.type === "FIXED") {
    const amount = Math.min(Number(rule.value), qualifyingSubtotal);
    return { amount, freeShipping: false };
  }

  return { amount: 0, freeShipping: false };
}

/**
 * Main promotion evaluation engine.
 * Evaluates both automatic promotions and user-entered promo code.
 */
export function evaluatePromotionsAndDiscounts(
  items: CartItemForDiscount[],
  automaticPromotions: PromotionRule[],
  appliedPromoRule?: PromotionRule | null
): PromotionEvaluationResult {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  let automaticDiscountAmount = 0;
  let promoCodeDiscountAmount = 0;
  let freeShipping = false;
  const appliedPromotions: AppliedPromotionDetail[] = [];

  // Evaluate active automatic promotions
  for (const rule of automaticPromotions) {
    if (!rule.active) continue;
    const { amount, freeShipping: fs } = calculateRuleDiscount(rule, items, subtotal);
    if (amount > 0 || fs) {
      automaticDiscountAmount += amount;
      if (fs) freeShipping = true;

      let desc = `${rule.type === "PERCENTAGE" ? `${rule.value}% OFF` : rule.type === "FIXED" ? `${rule.value} EGP OFF` : rule.type === "BUY_X_GET_Y" ? `BUY ${rule.buyQuantity} GET ${rule.getQuantity}` : "FREE SHIPPING"}`;
      if (rule.scope === "PRODUCT_LINE") desc += ` on ${rule.targetProductLine}`;
      else if (rule.scope === "SPECIFIC_PRODUCTS") desc += ` on selected items`;

      appliedPromotions.push({
        promotionId: rule.id,
        title: rule.title || rule.code || "Automatic Promotion",
        code: rule.code,
        isAutomatic: true,
        type: rule.type,
        discountAmount: amount,
        description: desc,
      });
    }
  }

  // Evaluate applied promo code rule
  if (appliedPromoRule && appliedPromoRule.active) {
    const { amount, freeShipping: fs } = calculateRuleDiscount(appliedPromoRule, items, subtotal);
    if (amount > 0 || fs) {
      promoCodeDiscountAmount = amount;
      if (fs) freeShipping = true;

      let desc = `${appliedPromoRule.type === "PERCENTAGE" ? `${appliedPromoRule.value}% OFF` : appliedPromoRule.type === "FIXED" ? `${appliedPromoRule.value} EGP OFF` : appliedPromoRule.type === "BUY_X_GET_Y" ? `BUY ${appliedPromoRule.buyQuantity} GET ${appliedPromoRule.getQuantity}` : "FREE SHIPPING"}`;
      if (appliedPromoRule.scope === "PRODUCT_LINE") desc += ` on ${appliedPromoRule.targetProductLine}`;
      else if (appliedPromoRule.scope === "SPECIFIC_PRODUCTS") desc += ` on selected items`;

      appliedPromotions.push({
        promotionId: appliedPromoRule.id,
        title: appliedPromoRule.title || appliedPromoRule.code || "Promo Code",
        code: appliedPromoRule.code,
        isAutomatic: false,
        type: appliedPromoRule.type,
        discountAmount: amount,
        description: desc,
      });
    }
  }

  // Cap total discount at subtotal
  const rawTotal = automaticDiscountAmount + promoCodeDiscountAmount;
  const totalDiscountAmount = Math.min(rawTotal, subtotal);
  const finalSubtotal = Math.max(0, subtotal - totalDiscountAmount);

  return {
    subtotal,
    automaticDiscountAmount,
    promoCodeDiscountAmount,
    totalDiscountAmount,
    freeShipping,
    appliedPromotions,
    finalSubtotal,
  };
}
