"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidatePrefix } from "@/lib/cache";
import { slugify } from "@/lib/format";
import { sendNotification } from "@/lib/notify";

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.coerce.number().int().min(0),
});

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  type: z.enum(["STUDIO", "EDITORIAL", "MOVEMENT", "MACRO", "TEXTURE"]).default("STUDIO"),
});

const productSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  line: z.enum(["ESSENTIALS", "GRAFFITI"]),
  campaignId: z.string().optional().nullable(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  fabric: z.string().optional(),
  care: z.string().optional(),
  story: z.string().optional(),
  storyAr: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  currency: z.string().default("EGP"),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  images: z.array(imageSchema).default([]),
  variants: z.array(variantSchema).min(1),
});

async function getDefaultLocationId() {
  const existing = await db.inventoryLocation.findFirst({ where: { name: "Main Warehouse" } });
  if (existing) return existing.id;
  const created = await db.inventoryLocation.create({
    data: { name: "Main Warehouse", type: "WAREHOUSE" },
  });
  return created.id;
}

async function invalidateProductCaches(slug?: string) {
  await invalidatePrefix("products:");
  if (slug) await invalidatePrefix(`product:${slug}`);
  revalidatePath("/");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function createProductAction(input: z.infer<typeof productSchema>) {
  await requireAdmin();
  const data = productSchema.parse(input);
  const locationId = await getDefaultLocationId();

  let slug = slugify(data.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const product = await db.product.create({
    data: {
      name: data.name,
      nameAr: data.nameAr,
      slug,
      line: data.line,
      campaignId: data.campaignId || null,
      description: data.description,
      descriptionAr: data.descriptionAr,
      fabric: data.fabric,
      care: data.care,
      story: data.story,
      storyAr: data.storyAr,
      basePrice: data.basePrice,
      currency: data.currency,
      status: data.status,
      images: {
        create: data.images.map((img, i) => ({ url: img.url, alt: img.alt, type: img.type, position: i })),
      },
      variants: {
        create: data.variants.map((v) => ({
          size: v.size,
          color: v.color,
          sku: v.sku,
          inventory: { create: { locationId, quantity: v.quantity } },
        })),
      },
    },
  });

  await invalidateProductCaches(slug);
  return { id: product.id, slug: product.slug };
}

export async function updateProductAction(productId: string, input: z.infer<typeof productSchema>) {
  await requireAdmin();
  const data = productSchema.parse(input);
  const locationId = await getDefaultLocationId();

  const existing = await db.product.findUniqueOrThrow({ where: { id: productId } });
  const restockedVariantIds: string[] = [];

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        line: data.line,
        campaignId: data.campaignId || null,
        description: data.description,
        descriptionAr: data.descriptionAr,
        fabric: data.fabric,
        care: data.care,
        story: data.story,
        storyAr: data.storyAr,
        basePrice: data.basePrice,
        currency: data.currency,
        status: data.status,
      },
    });

    await tx.productImage.deleteMany({ where: { productId } });
    if (data.images.length) {
      await tx.productImage.createMany({
        data: data.images.map((img, i) => ({
          productId,
          url: img.url,
          alt: img.alt,
          type: img.type,
          position: i,
        })),
      });
    }

    const existingVariants = await tx.productVariant.findMany({ where: { productId } });
    const keepSkus = new Set(data.variants.map((v) => v.sku));
    const toRemove = existingVariants.filter((v) => !keepSkus.has(v.sku));
    if (toRemove.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: toRemove.map((v) => v.id) } } });
    }

    for (const v of data.variants) {
      const match = existingVariants.find((e) => e.sku === v.sku);
      if (match) {
        await tx.productVariant.update({
          where: { id: match.id },
          data: { size: v.size, color: v.color },
        });
        const priorInventory = await tx.inventoryItem.findUnique({
          where: { variantId_locationId: { variantId: match.id, locationId } },
        });
        if ((priorInventory?.quantity ?? 0) === 0 && v.quantity > 0) {
          restockedVariantIds.push(match.id);
        }
        await tx.inventoryItem.upsert({
          where: { variantId_locationId: { variantId: match.id, locationId } },
          create: { variantId: match.id, locationId, quantity: v.quantity },
          update: { quantity: v.quantity },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            size: v.size,
            color: v.color,
            sku: v.sku,
            inventory: { create: { locationId, quantity: v.quantity } },
          },
        });
      }
    }
  });

  await invalidateProductCaches(existing.slug);

  if (restockedVariantIds.length) {
    await notifyBackInStock(restockedVariantIds);
  }

  return { id: productId };
}

async function notifyBackInStock(variantIds: string[]) {
  const alerts = await db.backInStockAlert.findMany({
    where: { variantId: { in: variantIds }, notified: false },
    include: { variant: { include: { product: true } } },
  });

  for (const alert of alerts) {
    await sendNotification(
      { email: alert.email },
      `${alert.variant.product.name} (${alert.variant.size}) is back in stock.`
    );
    await db.backInStockAlert.update({
      where: { id: alert.id },
      data: { notified: true, notifiedAt: new Date() },
    });
  }
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const product = await db.product.delete({ where: { id: productId } });
  await invalidateProductCaches(product.slug);
}

export async function setProductStatusAction(productId: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  await requireAdmin();
  const product = await db.product.update({ where: { id: productId }, data: { status } });
  await invalidateProductCaches(product.slug);
}
