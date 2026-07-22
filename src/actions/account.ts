"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  governorate: z.enum(EGYPT_GOVERNORATES),
  city: z.string().min(2),
  area: z.string().min(2),
  street: z.string().min(2),
  building: z.string().optional(),
  apartment: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export async function addAddressAction(input: z.infer<typeof addressSchema>) {
  const customer = await requireCustomer();
  const data = addressSchema.parse(input);

  if (data.isDefault) {
    await db.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }

  await db.address.create({ data: { ...data, customerId: customer.id } });
  revalidatePath("/account/addresses");
}

export async function updateAddressAction(addressId: string, input: z.infer<typeof addressSchema>) {
  const customer = await requireCustomer();
  const data = addressSchema.parse(input);

  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.customerId !== customer.id) throw new Error("Address not found.");

  if (data.isDefault) {
    await db.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }

  await db.address.update({ where: { id: addressId }, data });
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(addressId: string) {
  const customer = await requireCustomer();
  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.customerId !== customer.id) throw new Error("Address not found.");
  await db.address.delete({ where: { id: addressId } });
  revalidatePath("/account/addresses");
}

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8).optional(),
  preferredSize: z.string().optional(),
});

export async function updateProfileAction(input: z.infer<typeof profileSchema>) {
  const customer = await requireCustomer();
  const data = profileSchema.parse(input);
  await db.customer.update({ where: { id: customer.id }, data });
  revalidatePath("/account/profile");
  revalidatePath("/account");
}

export async function toggleWishlistAction(productId: string) {
  const customer = await requireCustomer();
  const existing = await db.wishlistItem.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { wishlisted: false };
  }

  await db.wishlistItem.create({ data: { customerId: customer.id, productId } });
  revalidatePath("/account/wishlist");
  return { wishlisted: true };
}

const returnRequestSchema = z.object({
  orderId: z.string(),
  type: z.enum(["RETURN", "EXCHANGE"]),
  reason: z.string().min(5, "Tell us a bit more about why."),
});

export async function createReturnRequestAction(input: z.infer<typeof returnRequestSchema>) {
  const customer = await requireCustomer();
  const data = returnRequestSchema.parse(input);

  const order = await db.order.findUnique({ where: { id: data.orderId } });
  if (!order || order.customerId !== customer.id) throw new Error("Order not found.");

  await db.returnRequest.create({
    data: {
      orderId: data.orderId,
      customerId: customer.id,
      type: data.type,
      reason: data.reason,
    },
  });
  revalidatePath("/account/returns");
}
