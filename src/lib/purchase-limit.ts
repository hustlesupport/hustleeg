import "server-only";
import { db } from "@/lib/db";

/**
 * Enforces `Campaign.purchaseLimitPerCustomer` (blueprint p.08) by capping
 * how many units of that campaign's products a single cart can hold.
 * Returns an error message if the desired quantity would exceed the limit,
 * or null if it's fine.
 */
export async function checkCampaignPurchaseLimit(
  cartId: string,
  variantId: string,
  desiredQuantityForVariant: number
): Promise<string | null> {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { product: { select: { campaignId: true, campaign: { select: { purchaseLimitPerCustomer: true, name: true } } } } },
  });

  const campaign = variant?.product.campaign;
  const limit = campaign?.purchaseLimitPerCustomer;
  if (!campaign || !limit) return null;

  const otherItems = await db.cartItem.findMany({
    where: {
      cartId,
      variantId: { not: variantId },
      savedForLater: false,
      variant: { product: { campaignId: variant!.product.campaignId } },
    },
    select: { quantity: true },
  });

  const otherQuantity = otherItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = otherQuantity + desiredQuantityForVariant;

  if (total > limit) {
    return `Limit ${limit} per customer for ${campaign.name} — you already have ${otherQuantity} in your bag.`;
  }
  return null;
}
