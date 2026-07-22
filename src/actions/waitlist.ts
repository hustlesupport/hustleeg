"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  campaignId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]).default("EMAIL"),
});

export async function joinWaitlistAction(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  if (!data.email && !data.phone) throw new Error("Enter an email or phone number.");
  await db.waitlistEntry.create({ data });
  return { ok: true };
}
