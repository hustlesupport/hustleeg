export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1079767537944763";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function pageview() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

export function event(name: string, options: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", name, options);
  }
}

export function trackAddToCart(data?: { productId?: string; value?: number; currency?: string }) {
  event("AddToCart", {
    content_ids: data?.productId ? [data.productId] : undefined,
    content_type: "product",
    value: data?.value,
    currency: data?.currency ?? "EGP",
  });
}

export function trackViewContent(data?: { productId?: string; value?: number; currency?: string }) {
  event("ViewContent", {
    content_ids: data?.productId ? [data.productId] : undefined,
    content_type: "product",
    value: data?.value,
    currency: data?.currency ?? "EGP",
  });
}

export function trackInitiateCheckout() {
  event("InitiateCheckout");
}

export function trackPurchase(data: { value: number; currency?: string; orderNumber?: string }) {
  event("Purchase", {
    value: data.value,
    currency: data.currency ?? "EGP",
    order_id: data.orderNumber,
  });
}
