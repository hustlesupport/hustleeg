"use client";

import { useState, useTransition } from "react";
import { addAddressAction, updateAddressAction, deleteAddressAction } from "@/actions/account";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  building: string | null;
  apartment: string | null;
  isDefault: boolean;
};

const EMPTY_FORM = {
  label: "",
  fullName: "",
  phone: "",
  governorate: "Cairo" as (typeof EGYPT_GOVERNORATES)[number],
  city: "",
  area: "",
  street: "",
  building: "",
  apartment: "",
  isDefault: false,
};

export function AddressManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(address: Address) {
    setEditingId(address.id);
    setShowNew(false);
    setForm({
      label: address.label ?? "",
      fullName: address.fullName,
      phone: address.phone,
      governorate: address.governorate as (typeof EGYPT_GOVERNORATES)[number],
      city: address.city,
      area: address.area,
      street: address.street,
      building: address.building ?? "",
      apartment: address.apartment ?? "",
      isDefault: address.isDefault,
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateAddressAction(editingId, form);
        } else {
          await addAddressAction(form);
        }
        setEditingId(null);
        setShowNew(false);
        setForm(EMPTY_FORM);
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save address.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    startTransition(async () => {
      await deleteAddressAction(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    });
  }

  const isFormOpen = showNew || editingId !== null;

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div key={address.id} className="border border-matte-black/10 p-4">
          <div className="flex items-start justify-between">
            <div className="font-mono text-xs">
              <p className="font-ui text-sm">
                {address.label || "Address"} {address.isDefault && <span className="text-neon-accent">· Default</span>}
              </p>
              <p className="mt-1">{address.fullName} · {address.phone}</p>
              <p className="text-concrete-grey">
                {address.street}, {address.area}, {address.city}, {address.governorate}
              </p>
            </div>
            <div className="flex gap-3 font-mono text-xs">
              <button onClick={() => startEdit(address)} className="hover:text-neon-accent">
                Edit
              </button>
              <button onClick={() => handleDelete(address.id)} className="text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {!isFormOpen && (
        <button
          onClick={() => {
            setShowNew(true);
            setForm(EMPTY_FORM);
          }}
          className="border border-dashed border-matte-black/30 px-4 py-3 font-mono text-xs uppercase tracking-widest hover:border-matte-black"
        >
          + Add address
        </button>
      )}

      {isFormOpen && (
        <form onSubmit={handleSave} className="space-y-3 border border-matte-black/10 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (e.g. Home)"
              className="input"
            />
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full name"
              className="input"
            />
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="input"
            />
            <select
              value={form.governorate}
              onChange={(e) => setForm({ ...form, governorate: e.target.value as (typeof EGYPT_GOVERNORATES)[number] })}
              className="input"
            >
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className="input"
            />
            <input
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="Area"
              className="input"
            />
            <input
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              placeholder="Street"
              className="input"
            />
            <input
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              placeholder="Building (optional)"
              className="input"
            />
            <input
              value={form.apartment}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              placeholder="Apartment (optional)"
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 font-mono text-xs">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default address
          </label>
          {error && <p className="font-mono text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              disabled={isPending}
              className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
            >
              {isPending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setEditingId(null);
              }}
              className="font-mono text-xs text-concrete-grey hover:text-matte-black"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
