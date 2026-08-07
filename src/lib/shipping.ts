const CAIRO_GIZA_RATE = 40;
const ALEXANDRIA_RATE = 50;

const FREE_SHIPPING_THRESHOLD = 2500;

export function calculateShipping(governorate: string, subtotal: number) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (governorate.trim().toLowerCase() === "alexandria") {
    return ALEXANDRIA_RATE;
  }
  return CAIRO_GIZA_RATE;
}

export function estimatedDeliveryDays(governorate?: string) {
  return "4-7 days";
}

