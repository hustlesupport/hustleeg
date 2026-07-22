"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

const journalSchema = z.object({
  title: z.string().min(2),
  titleAr: z.string().optional(),
  campaignId: z.string().optional().nullable(),
  coverImage: z.string().optional(),
  excerpt: z.string().optional(),
  excerptAr: z.string().optional(),
  body: z.string().min(10),
  bodyAr: z.string().optional(),
  author: z.string().optional(),
  membersOnly: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type JournalInput = z.infer<typeof journalSchema>;

export async function createJournalPostAction(input: JournalInput) {
  await requireAdmin();
  const data = journalSchema.parse(input);

  let slug = slugify(data.title);
  if (await db.journalPost.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await db.journalPost.create({
    data: {
      title: data.title,
      titleAr: data.titleAr,
      slug,
      campaignId: data.campaignId || null,
      coverImage: data.coverImage,
      excerpt: data.excerpt,
      excerptAr: data.excerptAr,
      body: data.body,
      bodyAr: data.bodyAr,
      author: data.author,
      membersOnly: data.membersOnly,
      publishedAt: data.published ? new Date() : null,
    },
  });

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

export async function updateJournalPostAction(id: string, input: JournalInput) {
  await requireAdmin();
  const data = journalSchema.parse(input);
  const existing = await db.journalPost.findUniqueOrThrow({ where: { id } });

  await db.journalPost.update({
    where: { id },
    data: {
      title: data.title,
      titleAr: data.titleAr,
      campaignId: data.campaignId || null,
      coverImage: data.coverImage,
      excerpt: data.excerpt,
      excerptAr: data.excerptAr,
      body: data.body,
      bodyAr: data.bodyAr,
      author: data.author,
      membersOnly: data.membersOnly,
      publishedAt: data.published ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  revalidatePath("/admin/journal");
  revalidatePath(`/journal/${existing.slug}`);
  revalidatePath("/journal");
}

export async function deleteJournalPostAction(id: string) {
  await requireAdmin();
  const post = await db.journalPost.delete({ where: { id } });
  revalidatePath("/admin/journal");
  revalidatePath(`/journal/${post.slug}`);
  revalidatePath("/journal");
}
