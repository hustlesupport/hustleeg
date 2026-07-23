// Shared between server (supabase-storage.ts) and client (product-form.tsx)
// code, so it can't carry "server-only" — just the bucket name, no secrets.
export const PRODUCT_IMAGES_BUCKET = "product-images";
