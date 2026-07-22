"use client";

import { useState, useTransition } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { addToCartAction } from "@/actions/cart";
import { requestBackInStockAlertAction } from "@/actions/back-in-stock";
import { logEventAction } from "@/actions/analytics";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { useLocale } from "@/components/storefront/locale-provider";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

export function AddToCart({
  variants,
  productId,
  defaultEmail,
}: {
  variants: Variant[];
  productId: string;
  defaultEmail?: string;
}) {
  const { refresh, open } = useCart();
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState(variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [alertEmail, setAlertEmail] = useState(defaultEmail ?? "");
  const [alertRequested, setAlertRequested] = useState(false);
  const [isAlertPending, startAlertTransition] = useTransition();

  const selected = variants.find((v) => v.id === selectedId);

  function handleAdd() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await addToCartAction({ variantId: selected.id, quantity: 1 });
        logEventAction({ type: "ADD_TO_CART", sessionId: getAnalyticsSessionId(), productId });
        await refresh();
        open();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add to bag.");
      }
    });
  }

  function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    startAlertTransition(async () => {
      await requestBackInStockAlertAction({ variantId: selected.id, email: alertEmail });
      setAlertRequested(true);
    });
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-2">{t("product_size")}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setSelectedId(v.id);
              setAlertRequested(false);
            }}
            className={`border px-4 py-2 font-mono text-sm ${
              v.id === selectedId
                ? "border-matte-black bg-matte-black text-off-white"
                : "border-matte-black/20"
            } ${v.stock === 0 ? "opacity-30 line-through" : "hover:border-matte-black"}`}
          >
            {v.size}
          </button>
        ))}
      </div>

      {selected && selected.stock > 0 && selected.stock <= 6 && (
        <p className="font-mono text-xs text-neon-accent mb-3">Only {selected.stock} left</p>
      )}

      {selected?.stock === 0 ? (
        alertRequested ? (
          <p className="font-mono text-xs text-neon-accent">We&rsquo;ll email you when it&rsquo;s back.</p>
        ) : (
          <form onSubmit={handleNotifyMe} className="flex gap-2">
            <input
              type="email"
              required
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="Email for restock alert"
              className="input flex-1"
            />
            <button
              disabled={isAlertPending}
              className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
            >
              {isAlertPending ? "…" : t("product_notify_me")}
            </button>
          </form>
        )
      ) : (
        <button
          onClick={handleAdd}
          disabled={!selected || isPending}
          className="w-full bg-matte-black py-4 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? t("product_adding") : t("product_add_to_bag")}
        </button>
      )}
      {error && <p className="mt-2 font-mono text-xs text-red-600">{error}</p>}
    </div>
  );
}
