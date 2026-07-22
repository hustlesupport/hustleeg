"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidatePrefix } from "@/lib/cache";

const locationSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["WAREHOUSE", "STUDIO", "POPUP"]),
});

export async function createLocationAction(input: z.infer<typeof locationSchema>) {
  await requireAdmin();
  const data = locationSchema.parse(input);
  await db.inventoryLocation.create({ data });
  revalidatePath("/admin/locations");
}

export async function deleteLocationAction(id: string) {
  await requireAdmin();
  const items = await db.inventoryItem.count({ where: { locationId: id, quantity: { gt: 0 } } });
  if (items > 0) throw new Error("This location still has stock assigned — move it before deleting.");
  await db.inventoryLocation.delete({ where: { id } });
  revalidatePath("/admin/locations");
}

export async function setStockAction(variantId: string, locationId: string, quantity: number) {
  await requireAdmin();
  const parsed = z.number().int().min(0).parse(quantity);
  await db.inventoryItem.upsert({
    where: { variantId_locationId: { variantId, locationId } },
    create: { variantId, locationId, quantity: parsed },
    update: { quantity: parsed },
  });

  const product = await db.product.findFirst({ where: { variants: { some: { id: variantId } } } });
  if (product) {
    await invalidatePrefix(`product:${product.slug}`);
    await invalidatePrefix("products:");
    revalidatePath(`/admin/products/${product.id}`);
    revalidatePath(`/products/${product.slug}`);
  }
}

export async function transferStockAction(variantId: string, fromLocationId: string, toLocationId: string, quantity: number) {
  await requireAdmin();
  const parsed = z.number().int().min(1).parse(quantity);

  await db.$transaction(async (tx) => {
    const from = await tx.inventoryItem.findUnique({
      where: { variantId_locationId: { variantId, locationId: fromLocationId } },
    });
    if (!from || from.quantity < parsed) throw new Error("Not enough stock at the source location.");

    await tx.inventoryItem.update({
      where: { variantId_locationId: { variantId, locationId: fromLocationId } },
      data: { quantity: { decrement: parsed } },
    });
    await tx.inventoryItem.upsert({
      where: { variantId_locationId: { variantId, locationId: toLocationId } },
      create: { variantId, locationId: toLocationId, quantity: parsed },
      update: { quantity: { increment: parsed } },
    });
  });

  const product = await db.product.findFirst({ where: { variants: { some: { id: variantId } } } });
  if (product) {
    await invalidatePrefix(`product:${product.slug}`);
    revalidatePath(`/admin/products/${product.id}`);
  }
}
