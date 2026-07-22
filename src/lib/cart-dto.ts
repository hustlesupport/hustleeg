import type { Prisma } from "@/generated/prisma/client";

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        variant: {
          include: {
            product: { include: { images: true } };
            inventory: true;
          };
        };
      };
    };
  };
}>;

export type CartItemDTO = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  lineTotal: number;
  maxQuantity: number;
  savedForLater: boolean;
};

export type CartDTO = {
  id: string;
  itemCount: number;
  subtotal: number;
  currency: string;
  items: CartItemDTO[];
  savedItems: CartItemDTO[];
};

export function toCartDTO(cart: CartWithItems): CartDTO {
  const allItems: CartItemDTO[] = cart.items.map((item) => {
    const price = Number(item.priceAtAdd);
    const stock = item.variant.inventory.reduce((sum, i) => sum + i.quantity, 0);
    return {
      id: item.id,
      variantId: item.variantId,
      productSlug: item.variant.product.slug,
      productName: item.variant.product.name,
      size: item.variant.size,
      color: item.variant.color,
      imageUrl: item.variant.product.images[0]?.url ?? null,
      quantity: item.quantity,
      price,
      lineTotal: price * item.quantity,
      maxQuantity: stock,
      savedForLater: item.savedForLater,
    };
  });

  const items = allItems.filter((i) => !i.savedForLater);
  const savedItems = allItems.filter((i) => i.savedForLater);

  return {
    id: cart.id,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    currency: cart.currency,
    items,
    savedItems,
  };
}
