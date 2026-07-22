"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaignAction, updateCampaignAction, deleteCampaignAction } from "@/actions/admin-campaigns";

type CampaignFormValues = {
  id?: string;
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  story: string;
  storyAr: string;
  heroImageUrl: string;
  status: "UPCOMING" | "LIVE" | "ENDED" | "ARCHIVED";
  startAt: string;
  endAt: string;
  earlyAccessAt: string;
  earlyAccessTier: "MEMBER" | "INSIDER" | "VIP" | "";
  purchaseLimitPerCustomer: number | null;
  raffleMode: boolean;
};

const EMPTY: CampaignFormValues = {
  name: "",
  nameAr: "",
  tagline: "",
  taglineAr: "",
  story: "",
  storyAr: "",
  heroImageUrl: "",
  status: "UPCOMING",
  startAt: "",
  endAt: "",
  earlyAccessAt: "",
  earlyAccessTier: "",
  purchaseLimitPerCustomer: null,
  raffleMode: false,
};

export function CampaignForm({ initial }: { initial?: CampaignFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = { ...values, earlyAccessTier: values.earlyAccessTier || null };
        if (values.id) {
          await updateCampaignAction(values.id, payload);
        } else {
          await createCampaignAction(payload);
        }
        router.push("/admin/campaigns");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function handleDelete() {
    if (!values.id) return;
    if (!confirm("Delete this campaign? Products linked to it will be unlinked, not deleted.")) return;
    startTransition(async () => {
      await deleteCampaignAction(values.id!);
      router.push("/admin/campaigns");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={values.name} onChange={(e) => update("name", e.target.value)} placeholder="Campaign name" className="input" />
        <input
          dir="rtl"
          value={values.nameAr}
          onChange={(e) => update("nameAr", e.target.value)}
          placeholder="الاسم بالعربية (optional)"
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input value={values.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Tagline" className="input" />
        <input
          dir="rtl"
          value={values.taglineAr}
          onChange={(e) => update("taglineAr", e.target.value)}
          placeholder="الشعار بالعربية (optional)"
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <textarea value={values.story} onChange={(e) => update("story", e.target.value)} placeholder="Story" rows={4} className="input" />
        <textarea
          dir="rtl"
          value={values.storyAr}
          onChange={(e) => update("storyAr", e.target.value)}
          placeholder="القصة بالعربية (optional)"
          rows={4}
          className="input"
        />
      </div>

      <input
        value={values.heroImageUrl}
        onChange={(e) => update("heroImageUrl", e.target.value)}
        placeholder="Hero image URL"
        className="input w-full"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <select value={values.status} onChange={(e) => update("status", e.target.value as CampaignFormValues["status"])} className="input">
          <option value="UPCOMING">Upcoming</option>
          <option value="LIVE">Live</option>
          <option value="ENDED">Ended</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <label className="flex items-center gap-2 font-mono text-xs">
          <input type="checkbox" checked={values.raffleMode} onChange={(e) => update("raffleMode", e.target.checked)} />
          Raffle mode (early access via lottery instead of waitlist)
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase text-concrete-grey mb-1">Public launch</p>
          <input type="datetime-local" value={values.startAt} onChange={(e) => update("startAt", e.target.value)} className="input w-full" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-concrete-grey mb-1">Ends</p>
          <input type="datetime-local" value={values.endAt} onChange={(e) => update("endAt", e.target.value)} className="input w-full" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-concrete-grey mb-1">Early access opens</p>
          <input
            type="datetime-local"
            value={values.earlyAccessAt}
            onChange={(e) => update("earlyAccessAt", e.target.value)}
            className="input w-full"
          />
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-concrete-grey mb-1">Early access tier</p>
          <select
            value={values.earlyAccessTier}
            onChange={(e) => update("earlyAccessTier", e.target.value as CampaignFormValues["earlyAccessTier"])}
            className="input w-full"
          >
            <option value="">No early access</option>
            <option value="MEMBER">Member</option>
            <option value="INSIDER">Insider</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-concrete-grey mb-1">Purchase limit per customer</p>
          <input
            type="number"
            min={1}
            value={values.purchaseLimitPerCustomer ?? ""}
            onChange={(e) => update("purchaseLimitPerCustomer", e.target.value ? Number(e.target.value) : null)}
            placeholder="No limit"
            className="input w-full"
          />
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          disabled={isPending}
          className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save campaign"}
        </button>
        {values.id && (
          <button type="button" onClick={handleDelete} className="font-mono text-xs text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
