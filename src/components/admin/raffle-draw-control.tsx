"use client";

import { useState, useTransition } from "react";
import { drawRaffleWinnersAction } from "@/actions/raffle";

export function RaffleDrawControl({ campaignId, pendingEntries }: { campaignId: string; pendingEntries: number }) {
  const [count, setCount] = useState(Math.min(10, pendingEntries));
  const [result, setResult] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDraw() {
    if (!confirm(`Draw ${count} winners from ${pendingEntries} entries?`)) return;
    startTransition(async () => {
      const res = await drawRaffleWinnersAction(campaignId, count);
      setResult(res.winnerCount);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        max={pendingEntries}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="input w-20"
      />
      <button
        disabled={isPending || pendingEntries === 0}
        onClick={handleDraw}
        className="bg-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
      >
        {isPending ? "Drawing…" : "Draw winners"}
      </button>
      {result !== null && <span className="font-mono text-xs text-neon-accent">{result} drawn</span>}
    </div>
  );
}
