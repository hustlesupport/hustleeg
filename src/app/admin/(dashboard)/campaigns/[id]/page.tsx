import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata = { title: "Edit campaign" };

function toLocalInput(date: Date | null) {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit campaign</h1>
      <CampaignForm
        initial={{
          id: campaign.id,
          name: campaign.name,
          nameAr: campaign.nameAr ?? "",
          tagline: campaign.tagline ?? "",
          taglineAr: campaign.taglineAr ?? "",
          story: campaign.story ?? "",
          storyAr: campaign.storyAr ?? "",
          heroImageUrl: campaign.heroImageUrl ?? "",
          status: campaign.status,
          startAt: toLocalInput(campaign.startAt),
          endAt: toLocalInput(campaign.endAt),
          earlyAccessAt: toLocalInput(campaign.earlyAccessAt),
          earlyAccessTier: campaign.earlyAccessTier ?? "",
          purchaseLimitPerCustomer: campaign.purchaseLimitPerCustomer,
          raffleMode: campaign.raffleMode,
        }}
      />
    </div>
  );
}
