"use client";

import { useEffect } from "react";
import { logEventAction } from "@/actions/analytics";
import { getAnalyticsSessionId } from "@/lib/analytics-session";

/** Invisible — fires one funnel event on mount. */
export function AnalyticsTracker({
  type,
  productId,
}: {
  type: "PRODUCT_VIEW" | "CHECKOUT_STARTED";
  productId?: string;
}) {
  useEffect(() => {
    logEventAction({ type, sessionId: getAnalyticsSessionId(), productId });
  }, [type, productId]);

  return null;
}
