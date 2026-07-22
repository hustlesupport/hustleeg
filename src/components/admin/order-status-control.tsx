"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/actions/admin-orders";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next);
      setCurrent(result.status as OrderStatus);
    });
  }

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
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
