import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata = { title: "New campaign" };

export default function NewCampaignPage() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-8">New campaign</h1>
      <CampaignForm />
    </div>
  );
}
