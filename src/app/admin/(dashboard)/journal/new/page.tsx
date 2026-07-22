import { db } from "@/lib/db";
import { JournalForm } from "@/components/admin/journal-form";

export const metadata = { title: "New journal post" };

export default async function NewJournalPostPage() {
  const campaigns = await db.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">New journal post</h1>
      <JournalForm campaigns={campaigns} />
    </div>
  );
}
