"use client";

import { useState, useTransition } from "react";
import { setStockAction } from "@/actions/admin-locations";

type Variant = { id: string; size: string; color: string; sku: string };
type Location = { id: string; name: string };
type StockMap = Record<string, Record<string, number>>; // variantId -> locationId -> qty

export function StockByLocation({
  variants,
  locations,
  initialStock,
}: {
  variants: Variant[];
  locations: Location[];
  initialStock: StockMap;
}) {
  const [stock, setStock] = useState<StockMap>(initialStock);
  const [isPending, startTransition] = useTransition();

  function handleChange(variantId: string, locationId: string, value: number) {
    setStock((s) => ({ ...s, [variantId]: { ...s[variantId], [locationId]: value } }));
    startTransition(() => setStockAction(variantId, locationId, value));
  }

  if (locations.length === 0) {
    return <p className="font-mono text-xs text-concrete-grey">No locations set up yet — add one under Locations.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2 pr-4">Variant</th>
            {locations.map((l) => (
              <th key={l.id} className="py-2 pr-4">
                {l.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.id} className="border-b border-matte-black/5">
              <td className="py-2 pr-4">
                {v.size} / {v.color}
              </td>
              {locations.map((l) => (
                <td key={l.id} className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    disabled={isPending}
                    value={stock[v.id]?.[l.id] ?? 0}
                    onChange={(e) => handleChange(v.id, l.id, Number(e.target.value))}
                    className="input w-20"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
