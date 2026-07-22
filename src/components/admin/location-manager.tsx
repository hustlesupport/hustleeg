"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLocationAction, deleteLocationAction } from "@/actions/admin-locations";

export function LocationManager({ locations }: { locations: { id: string; name: string; type: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"WAREHOUSE" | "STUDIO" | "POPUP">("WAREHOUSE");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      await createLocationAction({ name, type });
      setName("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    startTransition(async () => {
      try {
        await deleteLocationAction(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name" className="input flex-1" required />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
          <option value="WAREHOUSE">Warehouse</option>
          <option value="STUDIO">Studio</option>
          <option value="POPUP">Pop-up</option>
        </select>
        <button
          disabled={isPending}
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-4 font-mono text-xs text-red-600">{error}</p>}
      <div className="divide-y divide-matte-black/10 border border-matte-black/10">
        {locations.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3 font-mono text-xs">
            <span>
              {l.name} <span className="text-concrete-grey">({l.type})</span>
            </span>
            <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </div>
        ))}
        {locations.length === 0 && <p className="px-4 py-3 text-concrete-grey">No locations yet.</p>}
      </div>
    </div>
  );
}
