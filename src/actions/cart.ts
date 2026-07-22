"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateCart, getCart } from "@/lib/cart-session";
import { toCartDTO, type CartDTO } from "@/lib/cart-dto";
import { checkCampaignPurchaseLimit } from "@/lib/purchase-limit";

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
});

async function stockFor(variantId: string) {
  const items = await db.inventoryItem.findMany({ where: { variantId } });
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export async function getCartAction(): Promise<CartDTO> {
  const cart = await getCart();
  if (!cart) return { id: "", itemCount: 0, subtotal: 0, currency: "EGP", items: [], savedItems: [] };
  return toCartDTO(cart);
}

export async function addToCartAction(input: z.infer<typeof addSchema>): Promise<CartDTO> {
  const { variantId, quantity } = addSchema.parse(input);

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("This item is no longer available.");

  const stock = await stockFor(variantId);
  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.variantId === variantId);
  const desiredQuantity = (existing?.quantity ?? 0) + quantity;

  if (desiredQuantity > stock) {
    throw new Error(stock === 0 ? "This size is sold out." : `Only ${stock} left in stock.`);
  }

  const limitError = await checkCampaignPurchaseLimit(cart.id, variantId, desiredQuantity);
  if (limitError) throw new Error(limitError);

  const price = variant.priceOverride ?? (await db.product.findUniqueOrThrow({
    where: { id: variant.productId },
    select: { basePrice: true },
  })).basePrice;

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity, priceAtAdd: price },
    update: { quantity: desiredQuantity, savedForLater: false },
  });

  return getCartAction();
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<CartDTO> {
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return toCartDTO(cart);

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
    return getCartAction();
  }

  const stock = await stockFor(item.variantId);
  if (quantity > stock) throw new Error(`Only ${stock} left in stock.`);

  const limitError = await checkCampaignPurchaseLimit(cart.id, item.variantId, quantity);
  if (limitError) throw new Error(limitError);

  await db.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCartAction();
}

export async function removeCartItemAction(itemId: string): Promise<CartDTO> {
  await db.cartItem.deleteMany({ where: { id: itemId } });
  return getCartAction();
}

export async function saveForLaterAction(itemId: string): Promise<CartDTO> {
  await db.cartItem.updateMany({ where: { id: itemId }, data: { savedForLater: true } });
  return getCartAction();
}

export async function moveToCartAction(itemId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return getCartAction();

  const stock = await stockFor(item.variantId);
  if (stock < item.quantity) throw new Error(`Only ${stock} left in stock.`);

  const limitError = await checkCampaignPurchaseLimit(cart.id, item.variantId, item.quantity);
  if (limitError) throw new Error(limitError);

  await db.cartItem.update({ where: { id: itemId }, data: { savedForLater: false } });
  return getCartAction();
}
