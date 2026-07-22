const CAIRO_GIZA_RATE = 60;
const NATIONAL_RATE = 90;
const REMOTE_GOVERNORATES = new Set(["Red Sea", "New Valley", "Matrouh", "North Sinai", "South Sinai"]);
const REMOTE_RATE = 130;

const FREE_SHIPPING_THRESHOLD = 2500;

export function calculateShipping(governorate: string, subtotal: number) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (governorate === "Cairo" || governorate === "Giza") return CAIRO_GIZA_RATE;
  if (REMOTE_GOVERNORATES.has(governorate)) return REMOTE_RATE;
  return NATIONAL_RATE;
}

export function estimatedDeliveryDays(governorate: string) {
  if (governorate === "Cairo" || governorate === "Giza") return "1-2 days";
  if (REMOTE_GOVERNORATES.has(governorate)) return "5-7 days";
  return "2-4 days";
}
