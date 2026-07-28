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
      const updated = await getAppliedDiscountAction();
      setApplied(updated);
      onChange?.(updated);
    });
  }

  const hasManualCode = applied?.code && applied.code !== "AUTO_PROMO";

  return (
    <div className="space-y-3">
      {/* Active Applied Promotions List */}
      {applied?.appliedPromotions && applied.appliedPromotions.length > 0 && (
        <div className="space-y-1.5">
          {applied.appliedPromotions.map((p, idx) => (
            <div
              key={p.promotionId || idx}
              className="flex items-center justify-between border border-neon-accent/40 bg-neon-accent/10 px-3 py-2 font-mono text-xs rounded"
            >
              <div>
                <span className="font-bold text-matte-black">{p.title}</span>
                <p className="text-[10px] text-concrete-grey">{p.description}</p>
              </div>
              <span className="font-bold text-matte-black">
                {p.discountAmount > 0 ? `-${formatMoney(p.discountAmount, currency)}` : p.type === "FREE_SHIPPING" ? "FREE SHIP" : "APPLIED"}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasManualCode && (
        <div className="flex items-center justify-between font-mono text-xs text-concrete-grey">
          <span>Code <strong className="text-matte-black">{applied?.code}</strong> active</span>
          <button type="button" onClick={handleRemove} disabled={isPending} className="underline text-red-600 hover:text-red-800">
            Remove Code
          </button>
        </div>
      )}

      {!hasManualCode && (
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
      )}
    </div>
  );
}
