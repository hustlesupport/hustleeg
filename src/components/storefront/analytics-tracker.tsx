"use client";

import { useEffect } from "react";
import { logEventAction } from "@/actions/analytics";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { trackViewContent, trackInitiateCheckout } from "@/lib/meta-pixel";

/** Invisible — fires funnel events on mount. */
export function AnalyticsTracker({
  type,
  productId,
}: {
  type: "PRODUCT_VIEW" | "CHECKOUT_STARTED";
  productId?: string;
}) {
  useEffect(() => {
    logEventAction({ type, sessionId: getAnalyticsSessionId(), productId });
    if (type === "PRODUCT_VIEW") {
      trackViewContent({ productId });
    } else if (type === "CHECKOUT_STARTED") {
      trackInitiateCheckout();
    }
  }, [type, productId]);

  return null;
}
