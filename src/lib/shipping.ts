// Temporarily Cairo/Giza only (see governorates.ts) — flat rate, no
// per-governorate tiers needed while those are the only two options.
const CAIRO_GIZA_RATE = 80;

const FREE_SHIPPING_THRESHOLD = 2500;

export function calculateShipping(governorate: string, subtotal: number) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return CAIRO_GIZA_RATE;
}

export function estimatedDeliveryDays(governorate: string) {
  return "1-2 days";
}
