import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { JournalForm } from "@/components/admin/journal-form";

export const metadata = { title: "Edit journal post" };

export default async function EditJournalPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, campaigns] = await Promise.all([
    db.journalPost.findUnique({ where: { id } }),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit journal post</h1>
      <JournalForm
        campaigns={campaigns}
        initial={{
          id: post.id,
          title: post.title,
          titleAr: post.titleAr ?? "",
          campaignId: post.campaignId,
          coverImage: post.coverImage ?? "",
          excerpt: post.excerpt ?? "",
          excerptAr: post.excerptAr ?? "",
          body: post.body,
          bodyAr: post.bodyAr ?? "",
          author: post.author ?? "",
          membersOnly: post.membersOnly,
          published: Boolean(post.publishedAt),
        }}
      />
    </div>
  );
}
