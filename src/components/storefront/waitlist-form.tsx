"use client";

import { useState, useTransition } from "react";
import { joinWaitlistAction } from "@/actions/waitlist";

export function WaitlistForm({ campaignId }: { campaignId?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await joinWaitlistAction({ campaignId, email, channel: "EMAIL" });
        setStatus("done");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "done") {
    return <p className="font-mono text-xs text-neon-accent">You&rsquo;re on the list.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="flex-1 border border-off-white/30 bg-transparent px-3 py-2 font-mono text-sm placeholder:text-off-white/40"
      />
      <button
        disabled={isPending}
        className="bg-neon-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-matte-black disabled:opacity-40"
      >
        {isPending ? "…" : "Notify me"}
      </button>
      {status === "error" && <p className="font-mono text-xs text-red-500">Try again.</p>}
    </form>
  );
}
