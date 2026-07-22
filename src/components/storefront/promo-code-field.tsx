"use client";

import { useEffect, useState, useTransition } from "react";
import { applyDiscountCodeAction, removeDiscountCodeAction, getAppliedDiscountAction, type AppliedDiscount } from "@/actions/discount";
import { formatMoney } from "@/lib/format";

export function PromoCodeField({ currency, onChange }: { currency: string; onChange?: (discount: AppliedDiscount | null) => void }) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<AppliedDiscount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAppliedDiscountAction().then((discount) => {
      setApplied(discount);
      onChange?.(discount);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const discount = await applyDiscountCodeAction(code);
        setApplied(discount);
        onChange?.(discount);
        setCode("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid code.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeDiscountCodeAction();
      setApplied(null);
      onChange?.(null);
    });
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between border border-neon-accent/40 bg-neon-accent/10 px-3 py-2 font-mono text-xs">
        <span>
          {applied.code} applied
          {applied.freeShipping ? " — free shipping" : ` — ${formatMoney(applied.amount, currency)} off`}
        </span>
        <button type="button" onClick={handleRemove} disabled={isPending} className="underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-1">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          className="input flex-1 uppercase"
        />
        <button
          disabled={isPending || !code}
          className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
        >
          {isPending ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
    </form>
  );
}
