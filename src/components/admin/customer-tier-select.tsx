"use client";

import { useState, useTransition } from "react";
import { updateCustomerTierAction } from "@/actions/admin-customers";

const TIERS = ["MEMBER", "INSIDER", "VIP"] as const;
type Tier = (typeof TIERS)[number];

export function CustomerTierSelect({ customerId, tier }: { customerId: string; tier: Tier }) {
  const [current, setCurrent] = useState<Tier>(tier);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Tier) {
    setCurrent(next);
    startTransition(() => updateCustomerTierAction(customerId, next));
  }

  return (
    <select value={current} disabled={isPending} onChange={(e) => handleChange(e.target.value as Tier)} className="input">
      {TIERS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
