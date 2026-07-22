"use client";

import { useState, useTransition } from "react";
import { joinRaffleAction } from "@/actions/raffle";

export function RaffleForm({ campaignId, defaultEmail }: { campaignId: string; defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await joinRaffleAction({ campaignId, email, phone: phone || undefined });
      setDone(true);
    });
  }

  if (done) {
    return <p className="font-mono text-xs text-neon-accent">You&rsquo;re entered — winners get an early-access link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="flex-1 border border-off-white/30 bg-transparent px-3 py-2 font-mono text-sm placeholder:text-off-white/40"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="flex-1 border border-off-white/30 bg-transparent px-3 py-2 font-mono text-sm placeholder:text-off-white/40"
      />
      <button
        disabled={isPending}
        className="bg-neon-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-matte-black disabled:opacity-40"
      >
        {isPending ? "…" : "Enter raffle"}
      </button>
    </form>
  );
}
