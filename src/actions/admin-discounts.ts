"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const discountSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.coerce.number().min(0),
  minSpend: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export type DiscountCodeInput = z.infer<typeof discountSchema>;

export async function createDiscountCodeAction(input: DiscountCodeInput) {
  await requireAdmin();
  const data = discountSchema.parse(input);
  await db.discountCode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
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
  await db.discountCode.update({
    where: { id },
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
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
