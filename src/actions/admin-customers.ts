"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function updateCustomerTagsAction(customerId: string, tags: string[]) {
  await requireAdmin();
  await db.customer.update({ where: { id: customerId }, data: { tags } });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function updateCustomerNotesAction(customerId: string, notes: string) {
  await requireAdmin();
  await db.customer.update({ where: { id: customerId }, data: { adminNotes: notes } });
  revalidatePath(`/admin/customers/${customerId}`);
}

const tierSchema = z.enum(["MEMBER", "INSIDER", "VIP"]);

export async function updateCustomerTierAction(customerId: string, tier: z.infer<typeof tierSchema>) {
  const admin = await requireAdmin();
  const parsed = tierSchema.parse(tier);
  await db.customer.update({ where: { id: customerId }, data: { loyaltyTier: parsed } });
  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "CUSTOMER_TIER_UPDATE",
      entity: "Customer",
      entityId: customerId,
      meta: { tier: parsed },
    },
  });
  revalidatePath(`/admin/customers/${customerId}`);
}

export type CustomerSegment = "all" | "vip" | "first-time" | "lapsed";

export async function exportSegmentAction(segment: CustomerSegment): Promise<string> {
  await requireAdmin();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);

  const customers = await db.customer.findMany({
    where: segment === "vip" ? { loyaltyTier: "VIP" } : undefined,
    select: {
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      loyaltyTier: true,
      orders: { select: { createdAt: true } },
    },
  });

  const filtered =
    segment === "first-time"
      ? customers.filter((c) => c.orders.length === 1)
      : segment === "lapsed"
        ? customers.filter((c) => c.orders.length > 0 && c.orders.every((o) => o.createdAt < ninetyDaysAgo))
        : customers;

  const header = "email,phone,first_name,last_name,tier\n";
  const rows = filtered
    .map((c) => [c.email, c.phone ?? "", c.firstName ?? "", c.lastName ?? "", c.loyaltyTier].join(","))
    .join("\n");

  return header + rows;
}
