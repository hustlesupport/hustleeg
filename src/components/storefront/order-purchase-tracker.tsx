"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/meta-pixel";

export function OrderPurchaseTracker({
  value,
  currency,
  orderNumber,
}: {
  value: number;
  currency: string;
  orderNumber: string;
}) {
  useEffect(() => {
    trackPurchase({ value, currency, orderNumber });
  }, [value, currency, orderNumber]);

  return null;
}
