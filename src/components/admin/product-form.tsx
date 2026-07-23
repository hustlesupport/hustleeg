"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction, deleteProductAction } from "@/actions/admin-products";
import { createProductImageUploadUrlAction } from "@/actions/admin-uploads";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage-constants";
import { uploadToSignedUrl } from "@/lib/supabase-browser";

type ImageRow = { url: string; alt: string; type: "STUDIO" | "EDITORIAL" | "MOVEMENT" | "MACRO" | "TEXTURE" };
type VariantRow = { size: string; color: string; sku: string; quantity: number };

type Campaign = { id: string; name: string };

type ProductFormValues = {
  id?: string;
  name: string;
  nameAr: string;
  line: "ESSENTIALS" | "GRAFFITI";
  campaignId: string | null;
  description: string;
  descriptionAr: string;
  fabric: string;
  care: string;
  story: string;
  storyAr: string;
  basePrice: number;
  currency: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "ARCHIVED";
  images: ImageRow[];
  variants: VariantRow[];
};

const EMPTY: ProductFormValues = {
  name: "",
  nameAr: "",
  line: "ESSENTIALS",
  campaignId: null,
  description: "",
  descriptionAr: "",
  fabric: "",
  care: "",
  story: "",
  storyAr: "",
  basePrice: 0,
  currency: "EGP",
  status: "DRAFT",
  images: [],
  variants: [{ size: "M", color: "Black", sku: "", quantity: 0 }],
};

export function ProductForm({
  initial,
  campaigns,
}: {
  initial?: ProductFormValues;
  campaigns: Campaign[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (files.length === 0) return;

    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { token, path, publicUrl } = await createProductImageUploadUrlAction(file.name);
          await uploadToSignedUrl(PRODUCT_IMAGES_BUCKET, path, token, file);
          return { url: publicUrl, alt: "", type: "STUDIO" as const };
        })
      );
      update("images", [...values.images, ...uploaded]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (values.id) {
          await updateProductAction(values.id, values);
        } else {
          await createProductAction(values);
        }
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function handleDelete() {
    if (!values.id) return;
    if (!confirm("Delete this product?")) return;
    startTransition(async () => {
      await deleteProductAction(values.id!);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Product name (e.g. Foundations Tee)"
          className="input"
        />
        <input
          dir="rtl"
          value={values.nameAr}
          onChange={(e) => update("nameAr", e.target.value)}
          placeholder="الاسم بالعربية (optional)"
          className="input"
        />
        <select value={values.line} onChange={(e) => update("line", e.target.value as ProductFormValues["line"])} className="input">
          <option value="ESSENTIALS">Essentials</option>
          <option value="GRAFFITI">Graffiti</option>
        </select>
        <select
          value={values.campaignId ?? ""}
          onChange={(e) => update("campaignId", e.target.value || null)}
          className="input"
        >
          <option value="">No campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={values.basePrice}
          onChange={(e) => update("basePrice", Number(e.target.value))}
          placeholder="Price (EGP)"
          className="input"
        />
        <select value={values.status} onChange={(e) => update("status", e.target.value as ProductFormValues["status"])} className="input">
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Description"
          rows={3}
          className="input"
        />
        <textarea
          dir="rtl"
          value={values.descriptionAr}
          onChange={(e) => update("descriptionAr", e.target.value)}
          placeholder="الوصف بالعربية (optional)"
          rows={3}
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={values.fabric} onChange={(e) => update("fabric", e.target.value)} placeholder="Fabric" className="input" />
        <input value={values.care} onChange={(e) => update("care", e.target.value)} placeholder="Care instructions" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <textarea
          value={values.story}
          onChange={(e) => update("story", e.target.value)}
          placeholder="Story / campaign context"
          rows={2}
          className="input"
        />
        <textarea
          dir="rtl"
          value={values.storyAr}
          onChange={(e) => update("storyAr", e.target.value)}
          placeholder="القصة بالعربية (optional)"
          rows={2}
          className="input"
        />
      </div>

      {/* Images */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-ui text-sm">Images</h3>
          <label className="font-mono text-xs text-concrete-grey hover:text-matte-black cursor-pointer">
            {uploading ? "Uploading…" : "+ Upload image"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && <p className="mb-2 font-mono text-xs text-red-600">{uploadError}</p>}
        <div className="space-y-2">
          {values.images.map((img, i) => (
            <div key={img.url} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail of an
                  already-uploaded file; next/image's remotePatterns allowlist is unnecessary overhead here */}
              <img src={img.url} alt="" className="h-12 w-12 object-cover bg-concrete-grey/15" />
              <input
                value={img.alt}
                onChange={(e) => {
                  const next = [...values.images];
                  next[i] = { ...img, alt: e.target.value };
                  update("images", next);
                }}
                placeholder="Alt text"
                className="input"
              />
              <select
                value={img.type}
                onChange={(e) => {
                  const next = [...values.images];
                  next[i] = { ...img, type: e.target.value as ImageRow["type"] };
                  update("images", next);
                }}
                className="input"
              >
                {["STUDIO", "EDITORIAL", "MOVEMENT", "MACRO", "TEXTURE"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => update("images", values.images.filter((_, idx) => idx !== i))}
                className="font-mono text-xs text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-ui text-sm">Variants</h3>
          <button
            type="button"
            onClick={() =>
              update("variants", [...values.variants, { size: "", color: "", sku: "", quantity: 0 }])
            }
            className="font-mono text-xs text-concrete-grey hover:text-matte-black"
          >
            + Add variant
          </button>
        </div>
        <div className="space-y-2">
          {values.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2">
              <input
                required
                value={v.size}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[i] = { ...v, size: e.target.value };
                  update("variants", next);
                }}
                placeholder="Size"
                className="input"
              />
              <input
                required
                value={v.color}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[i] = { ...v, color: e.target.value };
                  update("variants", next);
                }}
                placeholder="Color"
                className="input"
              />
              <input
                required
                value={v.sku}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[i] = { ...v, sku: e.target.value };
                  update("variants", next);
                }}
                placeholder="SKU"
                className="input"
              />
              <input
                required
                type="number"
                min={0}
                value={v.quantity}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[i] = { ...v, quantity: Number(e.target.value) };
                  update("variants", next);
                }}
                placeholder="Qty"
                className="input w-20"
              />
              <button
                type="button"
                onClick={() => update("variants", values.variants.filter((_, idx) => idx !== i))}
                className="font-mono text-xs text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          disabled={isPending}
          className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save product"}
        </button>
        {values.id && (
          <button
            type="button"
            onClick={handleDelete}
            className="font-mono text-xs text-red-600 hover:underline"
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
