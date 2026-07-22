"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { sendNotification } from "@/lib/notify";
import { revalidatePath } from "next/cache";

const entrySchema = z.object({
  campaignId: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function joinRaffleAction(input: z.infer<typeof entrySchema>) {
  const data = entrySchema.parse(input);
  const customer = await getCurrentCustomer();

  await db.raffleEntry.upsert({
    where: { campaignId_email: { campaignId: data.campaignId, email: data.email } },
    update: {},
    create: { ...data, customerId: customer?.id },
  });

  return { ok: true };
}

export async function drawRaffleWinnersAction(campaignId: string, winnerCount: number) {
  await requireAdmin();

  const entries = await db.raffleEntry.findMany({
    where: { campaignId, selected: false },
  });

  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, winnerCount);

  for (const winner of winners) {
    await db.raffleEntry.update({
      where: { id: winner.id },
      data: { selected: true, notifiedAt: new Date() },
    });
    await sendNotification(
      { email: winner.email, phone: winner.phone ?? undefined },
      "You've won early access — check your email for the link."
    );
  }

  await db.campaign.update({ where: { id: campaignId }, data: { raffleDrawnAt: new Date() } });

  revalidatePath("/admin/campaigns");
  return { winnerCount: winners.length };
}
