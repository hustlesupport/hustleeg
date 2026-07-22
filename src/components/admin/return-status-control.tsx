"use client";

import { useState, useTransition } from "react";
import { updateReturnStatusAction } from "@/actions/admin-returns";

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;
type Status = (typeof STATUSES)[number];

export function ReturnStatusControl({ requestId, status }: { requestId: string; status: Status }) {
  const [current, setCurrent] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Status) {
    setCurrent(next);
    startTransition(() => updateReturnStatusAction(requestId, next));
  }

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Status)}
      className="input"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
