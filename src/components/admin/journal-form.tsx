"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJournalPostAction, updateJournalPostAction, deleteJournalPostAction } from "@/actions/admin-journal";

type JournalFormValues = {
  id?: string;
  title: string;
  titleAr: string;
  campaignId: string | null;
  coverImage: string;
  excerpt: string;
  excerptAr: string;
  body: string;
  bodyAr: string;
  author: string;
  membersOnly: boolean;
  published: boolean;
};

const EMPTY: JournalFormValues = {
  title: "",
  titleAr: "",
  campaignId: null,
  coverImage: "",
  excerpt: "",
  excerptAr: "",
  body: "",
  bodyAr: "",
  author: "",
  membersOnly: false,
  published: false,
};

export function JournalForm({
  initial,
  campaigns,
}: {
  initial?: JournalFormValues;
  campaigns: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<JournalFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof JournalFormValues>(key: K, value: JournalFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (values.id) {
          await updateJournalPostAction(values.id, values);
        } else {
          await createJournalPostAction(values);
        }
        router.push("/admin/journal");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function handleDelete() {
    if (!values.id) return;
    if (!confirm("Delete this journal post?")) return;
    startTransition(async () => {
      await deleteJournalPostAction(values.id!);
      router.push("/admin/journal");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="Title" className="input" />
        <input
          dir="rtl"
          value={values.titleAr}
          onChange={(e) => update("titleAr", e.target.value)}
          placeholder="العنوان بالعربية (optional)"
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <select value={values.campaignId ?? ""} onChange={(e) => update("campaignId", e.target.value || null)} className="input">
          <option value="">No campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input value={values.author} onChange={(e) => update("author", e.target.value)} placeholder="Author" className="input" />
      </div>

      <input
        value={values.coverImage}
        onChange={(e) => update("coverImage", e.target.value)}
        placeholder="Cover image URL"
        className="input w-full"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <textarea value={values.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Excerpt" rows={2} className="input" />
        <textarea
          dir="rtl"
          value={values.excerptAr}
          onChange={(e) => update("excerptAr", e.target.value)}
          placeholder="مقتطف بالعربية (optional)"
          rows={2}
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <textarea required value={values.body} onChange={(e) => update("body", e.target.value)} placeholder="Body" rows={10} className="input" />
        <textarea
          dir="rtl"
          value={values.bodyAr}
          onChange={(e) => update("bodyAr", e.target.value)}
          placeholder="النص بالعربية (optional)"
          rows={10}
          className="input"
        />
      </div>

      <div className="flex items-center gap-6 font-mono text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.membersOnly} onChange={(e) => update("membersOnly", e.target.checked)} />
          Members only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.published} onChange={(e) => update("published", e.target.checked)} />
          Published
        </label>
      </div>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          disabled={isPending}
          className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save post"}
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
