"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { sendNotification } from "@/lib/notify";
import { invalidatePrefix } from "@/lib/cache";
import { slugify } from "@/lib/format";

const campaignSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  tagline: z.string().optional(),
  taglineAr: z.string().optional(),
  story: z.string().optional(),
  storyAr: z.string().optional(),
  heroImageUrl: z.string().optional(),
  status: z.enum(["UPCOMING", "LIVE", "ENDED", "ARCHIVED"]),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  earlyAccessAt: z.string().optional().nullable(),
  earlyAccessTier: z.enum(["MEMBER", "INSIDER", "VIP"]).optional().nullable(),
  purchaseLimitPerCustomer: z.coerce.number().int().min(1).optional().nullable(),
  raffleMode: z.boolean().default(false),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

async function invalidateCampaignCaches(slug?: string) {
  await invalidatePrefix("campaign:");
  if (slug) await invalidatePrefix(`campaign:${slug}`);
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
  if (slug) revalidatePath(`/collections/drop/${slug}`);
}

export async function createCampaignAction(input: CampaignInput) {
  await requireAdmin();
  const data = campaignSchema.parse(input);

  let slug = slugify(data.name);
  if (await db.campaign.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await db.campaign.create({
    data: {
      name: data.name,
      nameAr: data.nameAr,
      slug,
      tagline: data.tagline,
      taglineAr: data.taglineAr,
      story: data.story,
      storyAr: data.storyAr,
      heroImageUrl: data.heroImageUrl,
      status: data.status,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      earlyAccessAt: data.earlyAccessAt ? new Date(data.earlyAccessAt) : null,
      earlyAccessTier: data.earlyAccessTier || null,
      purchaseLimitPerCustomer: data.purchaseLimitPerCustomer || null,
      raffleMode: data.raffleMode,
    },
  });

  await invalidateCampaignCaches(slug);
}

export async function updateCampaignAction(id: string, input: CampaignInput) {
  await requireAdmin();
  const data = campaignSchema.parse(input);
  const existing = await db.campaign.findUniqueOrThrow({ where: { id } });

  await db.campaign.update({
    where: { id },
    data: {
      name: data.name,
      nameAr: data.nameAr,
      tagline: data.tagline,
      taglineAr: data.taglineAr,
      story: data.story,
      storyAr: data.storyAr,
      heroImageUrl: data.heroImageUrl,
      status: data.status,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      earlyAccessAt: data.earlyAccessAt ? new Date(data.earlyAccessAt) : null,
      earlyAccessTier: data.earlyAccessTier || null,
      purchaseLimitPerCustomer: data.purchaseLimitPerCustomer || null,
      raffleMode: data.raffleMode,
    },
  });

  await invalidateCampaignCaches(existing.slug);
}

export async function deleteCampaignAction(id: string) {
  await requireAdmin();
  const campaign = await db.campaign.delete({ where: { id } });
  await invalidateCampaignCaches(campaign.slug);
}

export async function notifyWaitlistAction(campaignId: string) {
  await requireAdmin();

  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const entries = await db.waitlistEntry.findMany({ where: { campaignId, notified: false } });

  for (const entry of entries) {
    await sendNotification(
      { email: entry.email ?? undefined, phone: entry.phone ?? undefined },
      `${campaign.name} is live now — shop it before it's gone.`
    );
    await db.waitlistEntry.update({ where: { id: entry.id }, data: { notified: true } });
  }

  return { notifiedCount: entries.length };
}
