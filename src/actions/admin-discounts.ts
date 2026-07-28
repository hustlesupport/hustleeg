"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const discountSchema = z.object({
  title: z.string().optional().nullable(),
  code: z.string().max(40).optional().nullable(),
  isAutomatic: z.boolean().default(false),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING", "BUY_X_GET_Y"]),
  scope: z.enum(["ALL_PRODUCTS", "PRODUCT_LINE", "SPECIFIC_PRODUCTS"]).default("ALL_PRODUCTS"),
  targetProductLine: z.enum(["ESSENTIALS", "GRAFFITI"]).optional().nullable(),
  targetProductIds: z.array(z.string()).default([]),
  value: z.coerce.number().min(0).default(0),
  buyQuantity: z.coerce.number().int().min(1).optional().nullable(),
  getQuantity: z.coerce.number().int().min(1).optional().nullable(),
  getDiscountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  minSpend: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export type DiscountCodeInput = z.infer<typeof discountSchema>;

export async function getAdminProductsForDiscountSelect() {
  await requireAdmin();
  const products = await db.product.findMany({
    where: { status: { in: ["ACTIVE", "SCHEDULED", "DRAFT"] } },
    select: { id: true, name: true, line: true, basePrice: true },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    line: p.line,
    basePrice: Number(p.basePrice),
  }));
}

export async function createDiscountCodeAction(input: DiscountCodeInput) {
  await requireAdmin();
  const data = discountSchema.parse(input);

  const codeValue = data.code?.trim() ? data.code.trim().toUpperCase() : null;
  if (!data.isAutomatic && !codeValue) {
    throw new Error("A promo code text is required when promotion is not automatic.");
  }

  await db.discountCode.create({
    data: {
      title: data.title?.trim() || (codeValue ? `Promo: ${codeValue}` : "Automatic Promotion"),
      code: codeValue,
      isAutomatic: data.isAutomatic,
      type: data.type,
      scope: data.scope,
      targetProductLine: data.scope === "PRODUCT_LINE" ? data.targetProductLine || null : null,
      targetProductIds: data.scope === "SPECIFIC_PRODUCTS" ? data.targetProductIds : [],
      value: data.value,
      buyQuantity: data.type === "BUY_X_GET_Y" ? data.buyQuantity || 1 : null,
      getQuantity: data.type === "BUY_X_GET_Y" ? data.getQuantity || 1 : null,
      getDiscountPercent: data.type === "BUY_X_GET_Y" ? data.getDiscountPercent ?? 100 : null,
      minSpend: data.minSpend || null,
      usageLimit: data.usageLimit || null,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      active: data.active,
    },
  });
  revalidatePath("/admin/discounts");
}

export async function updateDiscountCodeAction(id: string, input: DiscountCodeInput) {
  await requireAdmin();
  const data = discountSchema.parse(input);

  const codeValue = data.code?.trim() ? data.code.trim().toUpperCase() : null;
  if (!data.isAutomatic && !codeValue) {
    throw new Error("A promo code text is required when promotion is not automatic.");
  }

  await db.discountCode.update({
    where: { id },
    data: {
      title: data.title?.trim() || (codeValue ? `Promo: ${codeValue}` : "Automatic Promotion"),
      code: codeValue,
      isAutomatic: data.isAutomatic,
      type: data.type,
      scope: data.scope,
      targetProductLine: data.scope === "PRODUCT_LINE" ? data.targetProductLine || null : null,
      targetProductIds: data.scope === "SPECIFIC_PRODUCTS" ? data.targetProductIds : [],
      value: data.value,
      buyQuantity: data.type === "BUY_X_GET_Y" ? data.buyQuantity || 1 : null,
      getQuantity: data.type === "BUY_X_GET_Y" ? data.getQuantity || 1 : null,
      getDiscountPercent: data.type === "BUY_X_GET_Y" ? data.getDiscountPercent ?? 100 : null,
      minSpend: data.minSpend || null,
      usageLimit: data.usageLimit || null,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      active: data.active,
    },
  });
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountCodeAction(id: string, active: boolean) {
  await requireAdmin();
  await db.discountCode.update({ where: { id }, data: { active } });
  revalidatePath("/admin/discounts");
}

export async function deleteDiscountCodeAction(id: string) {
  await requireAdmin();
  await db.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}
