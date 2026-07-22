"use client";

import { useState, useTransition } from "react";
import { updateCustomerTagsAction, updateCustomerNotesAction } from "@/actions/admin-customers";

export function CustomerTagsNotes({
  customerId,
  initialTags,
  initialNotes,
}: {
  customerId: string;
  initialTags: string[];
  initialNotes: string;
}) {
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await Promise.all([updateCustomerTagsAction(customerId, tags), updateCustomerNotesAction(customerId, notes)]);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-1">Tags</p>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="ambassador, press, vip…"
          className="input w-full"
        />
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-1">Internal notes</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input w-full" />
      </div>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
