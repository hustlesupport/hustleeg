"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/actions/account";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProfileForm({
  initial,
}: {
  initial: { firstName: string; lastName: string; phone: string; preferredSize: string };
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfileAction({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          preferredSize: form.preferredSize || undefined,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save profile.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          placeholder="First name"
          className="input"
        />
        <input
          required
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          placeholder="Last name"
          className="input"
        />
      </div>
      <input
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder="Phone"
        className="input w-full"
      />

      <div>
        <p className="font-mono text-xs uppercase text-concrete-grey mb-2">Preferred size</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setForm({ ...form, preferredSize: size })}
              className={`border px-4 py-2 font-mono text-sm ${
                form.preferredSize === size ? "border-matte-black bg-matte-black text-off-white" : "border-matte-black/20"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
      {saved && <p className="font-mono text-xs text-neon-accent">Saved.</p>}
      <button
        disabled={isPending}
        className="bg-matte-black px-6 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
