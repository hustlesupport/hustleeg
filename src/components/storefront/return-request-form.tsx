"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReturnRequestAction } from "@/actions/account";

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [type, setType] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createReturnRequestAction({ orderId, type, reason });
        setDone(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit request.");
      }
    });
  }

  if (done) {
    return <p className="font-mono text-xs text-neon-accent">Request submitted — we&rsquo;ll follow up by email.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-matte-black/10 p-4">
      <div className="flex gap-2">
        {(["RETURN", "EXCHANGE"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`border px-3 py-1.5 font-mono text-xs uppercase ${
              type === t ? "border-matte-black bg-matte-black text-off-white" : "border-matte-black/20"
            }`}
          >
            {t === "RETURN" ? "Return" : "Exchange"}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        minLength={5}
        placeholder="Tell us what's wrong or what you'd like to exchange it for"
        rows={3}
        className="input w-full"
      />
      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
      <button
        disabled={isPending}
        className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
      >
        {isPending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
