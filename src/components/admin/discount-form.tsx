"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
  deleteDiscountCodeAction,
  type DiscountCodeInput,
} from "@/actions/admin-discounts";

type ProductOption = {
  id: string;
  name: string;
  line: string;
  basePrice: any;
};

type DiscountFormValues = {
  id?: string;
  title: string;
  code: string;
  isAutomatic: boolean;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  scope: "ALL_PRODUCTS" | "PRODUCT_LINE" | "SPECIFIC_PRODUCTS";
  targetProductLine: "ESSENTIALS" | "GRAFFITI" | null;
  targetProductIds: string[];
  value: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountPercent: number | null;
  minSpend: number | null;
  usageLimit: number | null;
  startAt: string | null;
  endAt: string | null;
  active: boolean;
};

const EMPTY: DiscountFormValues = {
  title: "",
  code: "",
  isAutomatic: false,
  type: "PERCENTAGE",
  scope: "ALL_PRODUCTS",
  targetProductLine: null,
  targetProductIds: [],
  value: 10,
  buyQuantity: 1,
  getQuantity: 1,
  getDiscountPercent: 100,
  minSpend: null,
  usageLimit: null,
  startAt: null,
  endAt: null,
  active: true,
};

export function DiscountForm({
  initial,
  products = [],
}: {
  initial?: DiscountFormValues;
  products?: ProductOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<DiscountFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof DiscountFormValues>(key: K, val: DiscountFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function toggleProductId(id: string) {
    setValues((v) => {
      const exists = v.targetProductIds.includes(id);
      return {
        ...v,
        targetProductIds: exists ? v.targetProductIds.filter((pid) => pid !== id) : [...v.targetProductIds, id],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload: DiscountCodeInput = {
          title: values.title || null,
          code: values.code || null,
          isAutomatic: values.isAutomatic,
          type: values.type,
          scope: values.scope,
          targetProductLine: values.targetProductLine,
          targetProductIds: values.targetProductIds,
          value: values.value,
          buyQuantity: values.buyQuantity,
          getQuantity: values.getQuantity,
          getDiscountPercent: values.getDiscountPercent,
          minSpend: values.minSpend,
          usageLimit: values.usageLimit,
          startAt: values.startAt,
          endAt: values.endAt,
          active: values.active,
        };

        if (values.id) {
          await updateDiscountCodeAction(values.id, payload);
        } else {
          await createDiscountCodeAction(payload);
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
    if (!confirm("Delete this promotion / discount code?")) return;
    startTransition(async () => {
      await deleteDiscountCodeAction(values.id!);
      router.push("/admin/discounts");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Title & Mode */}
      <div className="space-y-4 rounded border border-matte-black/10 p-4 bg-off-white/50">
        <div>
          <label className="block font-mono text-xs uppercase tracking-wider text-concrete-grey mb-1">
            Promotion Title
          </label>
          <input
            required
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Summer Sale 20% Off or Buy 1 Get 1 Free Graffiti"
            className="input w-full font-mono"
          />
        </div>

        {/* Toggle Automatic vs Promo Code */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
            <input
              type="radio"
              name="isAutomatic"
              checked={!values.isAutomatic}
              onChange={() => update("isAutomatic", false)}
              className="accent-neon-accent"
            />
            <span>Manual Promo Code (Typed at Checkout)</span>
          </label>
          <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
            <input
              type="radio"
              name="isAutomatic"
              checked={values.isAutomatic}
              onChange={() => update("isAutomatic", true)}
              className="accent-neon-accent"
            />
            <span className="font-semibold text-neon-accent">Automatic Promotion (Visible Storewide & Applied at Checkout)</span>
          </label>
        </div>

        {!values.isAutomatic && (
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-concrete-grey mb-1">
              Promo Code Text
            </label>
            <input
              required={!values.isAutomatic}
              value={values.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10 or BUY1GET1"
              className="input w-full font-mono uppercase tracking-widest font-bold"
            />
          </div>
        )}
      </div>

      {/* Offer Type & Value Settings */}
      <div className="space-y-4 rounded border border-matte-black/10 p-4 bg-off-white/50">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-matte-black">
          Discount Offer Type
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">Type</label>
            <select
              value={values.type}
              onChange={(e) => update("type", e.target.value as DiscountFormValues["type"])}
              className="input w-full"
            >
              <option value="PERCENTAGE">Percentage Off (%)</option>
              <option value="FIXED">Fixed EGP Amount Off</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
              <option value="BUY_X_GET_Y">Buy X Get Y (BOGO / Tiered)</option>
            </select>
          </div>

          {values.type === "PERCENTAGE" && (
            <div>
              <label className="block font-mono text-xs text-concrete-grey mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={values.value}
                onChange={(e) => update("value", Number(e.target.value))}
                placeholder="% off"
                className="input w-full"
              />
            </div>
          )}

          {values.type === "FIXED" && (
            <div>
              <label className="block font-mono text-xs text-concrete-grey mb-1">Discount Amount (EGP)</label>
              <input
                type="number"
                min={1}
                value={values.value}
                onChange={(e) => update("value", Number(e.target.value))}
                placeholder="EGP off"
                className="input w-full"
              />
            </div>
          )}
        </div>

        {/* Buy X Get Y Parameters */}
        {values.type === "BUY_X_GET_Y" && (
          <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-matte-black/10">
            <div>
              <label className="block font-mono text-xs text-concrete-grey mb-1">Customer Buys (Qty)</label>
              <input
                type="number"
                min={1}
                value={values.buyQuantity ?? 1}
                onChange={(e) => update("buyQuantity", Number(e.target.value))}
                className="input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-concrete-grey mb-1">Customer Gets (Qty)</label>
              <input
                type="number"
                min={1}
                value={values.getQuantity ?? 1}
                onChange={(e) => update("getQuantity", Number(e.target.value))}
                className="input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-concrete-grey mb-1">Get Discount (% off Y)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={values.getDiscountPercent ?? 100}
                onChange={(e) => update("getDiscountPercent", Number(e.target.value))}
                placeholder="100 = Free, 50 = Half Price"
                className="input w-full font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Target Scope */}
      <div className="space-y-4 rounded border border-matte-black/10 p-4 bg-off-white/50">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-matte-black">
          Target Scope (Eligible Products)
        </h2>
        <div>
          <select
            value={values.scope}
            onChange={(e) => update("scope", e.target.value as DiscountFormValues["scope"])}
            className="input w-full"
          >
            <option value="ALL_PRODUCTS">Storewide (All Products)</option>
            <option value="PRODUCT_LINE">Specific Product Line (Category)</option>
            <option value="SPECIFIC_PRODUCTS">Specific Selected Products</option>
          </select>
        </div>

        {values.scope === "PRODUCT_LINE" && (
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">Product Line</label>
            <select
              value={values.targetProductLine ?? "ESSENTIALS"}
              onChange={(e) => update("targetProductLine", e.target.value as "ESSENTIALS" | "GRAFFITI")}
              className="input w-full"
            >
              <option value="ESSENTIALS font-mono">ESSENTIALS Collection</option>
              <option value="GRAFFITI">GRAFFITI Streetwear Collection</option>
            </select>
          </div>
        )}

        {values.scope === "SPECIFIC_PRODUCTS" && (
          <div className="space-y-2">
            <label className="block font-mono text-xs text-concrete-grey">Select Products ({values.targetProductIds.length} selected)</label>
            <div className="max-h-48 overflow-y-auto border border-matte-black/10 rounded p-2 space-y-1 bg-white font-mono text-xs">
              {products.map((p) => {
                const isSelected = values.targetProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                      isSelected ? "bg-neon-accent/10 border border-neon-accent" : "hover:bg-off-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductId(p.id)}
                        className="accent-neon-accent"
                      />
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-concrete-grey">[{p.line}]</span>
                    </div>
                    <span>{Number(p.basePrice)} EGP</span>
                  </label>
                );
              })}
              {products.length === 0 && <p className="text-concrete-grey py-2">No active products found.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Constraints & Validity */}
      <div className="space-y-4 rounded border border-matte-black/10 p-4 bg-off-white/50">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-matte-black">
          Constraints & Validity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">Minimum Spend (EGP)</label>
            <input
              type="number"
              min={0}
              value={values.minSpend ?? ""}
              onChange={(e) => update("minSpend", e.target.value ? Number(e.target.value) : null)}
              placeholder="Optional min cart subtotal"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">Max Total Uses</label>
            <input
              type="number"
              min={1}
              value={values.usageLimit ?? ""}
              onChange={(e) => update("usageLimit", e.target.value ? Number(e.target.value) : null)}
              placeholder="Optional usage limit"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">Start Date</label>
            <input
              type="date"
              value={values.startAt ? values.startAt.slice(0, 10) : ""}
              onChange={(e) => update("startAt", e.target.value || null)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-concrete-grey mb-1">End Date</label>
            <input
              type="date"
              value={values.endAt ? values.endAt.slice(0, 10) : ""}
              onChange={(e) => update("endAt", e.target.value || null)}
              className="input w-full"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 font-mono text-xs pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => update("active", e.target.checked)}
            className="accent-neon-accent"
          />
          <span className="font-bold uppercase tracking-wider">Active</span>
        </label>
      </div>

      {error && <p className="font-mono text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          disabled={isPending}
          className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black transition-colors disabled:opacity-40"
        >
          {isPending ? "Saving…" : values.id ? "Update Promotion" : "Create Promotion"}
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
