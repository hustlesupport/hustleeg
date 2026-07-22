"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDiscountCodeAction, updateDiscountCodeAction, deleteDiscountCodeAction } from "@/actions/admin-discounts";

type DiscountFormValues = {
  id?: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSpend: number | null;
  usageLimit: number | null;
  startAt: string | null;
  endAt: string | null;
  active: boolean;
};

const EMPTY: DiscountFormValues = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minSpend: null,
  usageLimit: null,
  startAt: null,
  endAt: null,
  active: true,
};

export function DiscountForm({ initial }: { initial?: DiscountFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<DiscountFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof DiscountFormValues>(key: K, value: DiscountFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (values.id) {
          await updateDiscountCodeAction(values.id, values);
        } else {
          await createDiscountCodeAction(values);
        }
        router.push("/admin/discounts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function handleDelete() {
    if (!values.id) return;
    if (!confirm("Delete this discount code?")) return;
    startTransition(async () => {
      await deleteDiscountCodeAction(values.id!);
      router.push("/admin/discounts");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <input
        required
        value={values.code}
        onChange={(e) => update("code", e.target.value.toUpperCase())}
        placeholder="CODE (e.g. WELCOME10)"
        className="input w-full font-mono uppercase"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <select value={values.type} onChange={(e) => update("type", e.target.value as DiscountFormValues["type"])} className="input">
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED">Fixed amount off</option>
          <option value="FREE_SHIPPING">Free shipping</option>
        </select>
        <input
          type="number"
          min={0}
          disabled={values.type === "FREE_SHIPPING"}
          value={values.type === "FREE_SHIPPING" ? 0 : values.value}
          onChange={(e) => update("value", Number(e.target.value))}
          placeholder={values.type === "PERCENTAGE" ? "% off" : "EGP off"}
          className="input disabled:opacity-40"
        />
        <input
          type="number"
          min={0}
          value={values.minSpend ?? ""}
          onChange={(e) => update("minSpend", e.target.value ? Number(e.target.value) : null)}
          placeholder="Minimum spend (optional)"
          className="input"
        />
        <input
          type="number"
          min={1}
          value={values.usageLimit ?? ""}
          onChange={(e) => update("usageLimit", e.target.value ? Number(e.target.value) : null)}
          placeholder="Usage limit (optional)"
          className="input"
        />
        <input
          type="date"
          value={values.startAt ? values.startAt.slice(0, 10) : ""}
          onChange={(e) => update("startAt", e.target.value || null)}
          className="input"
        />
        <input
          type="date"
          value={values.endAt ? values.endAt.slice(0, 10) : ""}
          onChange={(e) => update("endAt", e.target.value || null)}
          className="input"
        />
      </div>
      <label className="flex items-center gap-2 font-mono text-xs">
        <input type="checkbox" checked={values.active} onChange={(e) => update("active", e.target.checked)} />
        Active
      </label>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          disabled={isPending}
          className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save code"}
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
