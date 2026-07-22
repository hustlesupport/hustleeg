"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffAction } from "@/actions/admin-staff";

export function StaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER" | "SUPPORT" | "FULFILLMENT">("SUPPORT");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createStaffAction({ email, name, role, password });
        setEmail("");
        setName("");
        setPassword("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add staff member.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 max-w-2xl">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
      <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="input">
        <option value="OWNER">Owner</option>
        <option value="MANAGER">Manager</option>
        <option value="SUPPORT">Support</option>
        <option value="FULFILLMENT">Fulfillment</option>
      </select>
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Temporary password (min 8 chars)"
        className="input"
      />
      {error && <p className="sm:col-span-2 font-mono text-xs text-red-600">{error}</p>}
      <button
        disabled={isPending}
        className="sm:col-span-2 bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
      >
        {isPending ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}
