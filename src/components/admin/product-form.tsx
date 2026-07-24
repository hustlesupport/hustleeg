"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction, deleteProductAction } from "@/actions/admin-products";
import { createProductImageUploadUrlAction } from "@/actions/admin-uploads";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage-constants";
import { uploadToSignedUrl } from "@/lib/supabase-browser";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

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
  sizeChartUrl: string;
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
  sizeChartUrl: "",
  basePrice: 0,
  currency: "EGP",
  status: "DRAFT",
  images: [],
  variants: [{ size: "M", color: "Black", sku: "", quantity: 0 }],
};

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-matte-black/10 pt-8 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-widest text-concrete-grey">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-[11px] uppercase tracking-widest text-concrete-grey">{label}</span>
      {children}
    </label>
  );
}

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
  const [sizeChartUploading, setSizeChartUploading] = useState(false);
  const [sizeChartError, setSizeChartError] = useState<string | null>(null);

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

  async function handleSizeChartSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSizeChartError(null);
    setSizeChartUploading(true);
    try {
      const { token, path, publicUrl } = await createProductImageUploadUrlAction(file.name);
      await uploadToSignedUrl(PRODUCT_IMAGES_BUCKET, path, token, file);
      update("sizeChartUrl", publicUrl);
    } catch (err) {
      setSizeChartError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSizeChartUploading(false);
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
      <Section title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name">
            <input
              required
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Foundations Tee"
              className="input w-full"
            />
          </Field>
          <Field label="Name (Arabic)">
            <input
              dir="rtl"
              value={values.nameAr}
              onChange={(e) => update("nameAr", e.target.value)}
              placeholder="الاسم بالعربية (optional)"
              className="input w-full"
            />
          </Field>
          <Field label="Line">
            <select value={values.line} onChange={(e) => update("line", e.target.value as ProductFormValues["line"])} className="input w-full">
              <option value="ESSENTIALS">Essentials</option>
              <option value="GRAFFITI">Graffiti</option>
            </select>
          </Field>
          <Field label="Campaign">
            <select
              value={values.campaignId ?? ""}
              onChange={(e) => update("campaignId", e.target.value || null)}
              className="input w-full"
            >
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (EGP)">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={values.basePrice}
              onChange={(e) => update("basePrice", Number(e.target.value))}
              placeholder="0.00"
              className="input w-full"
            />
          </Field>
          <Field label="Status">
            <select value={values.status} onChange={(e) => update("status", e.target.value as ProductFormValues["status"])} className="input w-full">
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Description">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description">
            <RichTextEditor
              value={values.description}
              onChange={(html) => update("description", html)}
              placeholder="Description"
            />
          </Field>
          <Field label="Description (Arabic)">
            <RichTextEditor
              dir="rtl"
              value={values.descriptionAr}
              onChange={(html) => update("descriptionAr", html)}
              placeholder="الوصف بالعربية (optional)"
            />
          </Field>
        </div>
      </Section>

      <Section title="Fit & care">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fabric">
            <input value={values.fabric} onChange={(e) => update("fabric", e.target.value)} placeholder="e.g. 240gsm combed cotton" className="input w-full" />
          </Field>
          <Field label="Care instructions">
            <input value={values.care} onChange={(e) => update("care", e.target.value)} placeholder="e.g. Cold wash, hang dry" className="input w-full" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Size chart">
            {values.sizeChartUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail of an
                    already-uploaded file; next/image's remotePatterns allowlist is unnecessary overhead here */}
                <img src={values.sizeChartUrl} alt="Size chart preview" className="h-16 w-16 border border-matte-black/10 object-cover" />
                <label className="font-mono text-xs text-concrete-grey hover:text-matte-black cursor-pointer">
                  {sizeChartUploading ? "Uploading…" : "Replace"}
                  <input type="file" accept="image/*" onChange={handleSizeChartSelected} disabled={sizeChartUploading} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => update("sizeChartUrl", "")}
                  className="font-mono text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="inline-block border border-dashed border-matte-black/20 px-4 py-3 font-mono text-xs text-concrete-grey hover:border-matte-black hover:text-matte-black cursor-pointer">
                {sizeChartUploading ? "Uploading…" : "+ Upload size chart image"}
                <input type="file" accept="image/*" onChange={handleSizeChartSelected} disabled={sizeChartUploading} className="hidden" />
              </label>
            )}
            {sizeChartError && <p className="mt-2 font-mono text-xs text-red-600">{sizeChartError}</p>}
          </Field>
        </div>
      </Section>

      <Section title="Story">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Story / campaign context">
            <RichTextEditor
              value={values.story}
              onChange={(html) => update("story", html)}
              placeholder="Story / campaign context"
            />
          </Field>
          <Field label="Story (Arabic)">
            <RichTextEditor
              dir="rtl"
              value={values.storyAr}
              onChange={(html) => update("storyAr", html)}
              placeholder="القصة بالعربية (optional)"
            />
          </Field>
        </div>
      </Section>

      {/* Images */}
      <Section
        title="Images"
        action={
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
        }
      >
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
          {values.images.length === 0 && (
            <p className="font-mono text-xs text-concrete-grey">No images yet.</p>
          )}
        </div>
      </Section>

      {/* Variants */}
      <Section
        title="Variants"
        action={
          <button
            type="button"
            onClick={() =>
              update("variants", [...values.variants, { size: "", color: "", sku: "", quantity: 0 }])
            }
            className="font-mono text-xs text-concrete-grey hover:text-matte-black"
          >
            + Add variant
          </button>
        }
      >
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
      </Section>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4 border-t border-matte-black/10 pt-8">
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
