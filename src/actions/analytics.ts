"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const eventSchema = z.object({
  type: z.enum(["PRODUCT_VIEW", "ADD_TO_CART", "CHECKOUT_STARTED"]),
  sessionId: z.string().min(1),
  productId: z.string().optional(),
});

export async function logEventAction(input: z.infer<typeof eventSchema>) {
  const data = eventSchema.parse(input);
  // Fire-and-forget by design — analytics must never block or break the
  // page it's instrumenting.
  await db.analyticsEvent.create({ data }).catch(() => {});
}
