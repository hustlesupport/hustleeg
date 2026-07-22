"use client";

import { useState, useTransition } from "react";
import { notifyWaitlistAction } from "@/actions/admin-campaigns";

export function NotifyWaitlistButton({ campaignId, waitlistCount }: { campaignId: string; waitlistCount: number }) {
  const [result, setResult] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Notify ${waitlistCount} waitlisted shoppers that this drop is live?`)) return;
    startTransition(async () => {
      const res = await notifyWaitlistAction(campaignId);
      setResult(res.notifiedCount);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isPending || waitlistCount === 0}
        onClick={handleClick}
        className="border border-matte-black px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
      >
        {isPending ? "Sending…" : "Notify waitlist"}
      </button>
      {result !== null && <span className="font-mono text-xs text-neon-accent">{result} notified</span>}
    </div>
  );
}
