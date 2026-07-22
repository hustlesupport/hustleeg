"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

const schema = z.object({
  variantId: z.string(),
  email: z.string().email(),
});

export async function requestBackInStockAlertAction(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  const customer = await getCurrentCustomer();

  await db.backInStockAlert.upsert({
    where: { variantId_email: { variantId: data.variantId, email: data.email } },
    update: {},
    create: { variantId: data.variantId, email: data.email, customerId: customer?.id },
  });

  return { ok: true };
}
