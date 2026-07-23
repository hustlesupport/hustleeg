import "server-only";
import { createClient } from "@supabase/supabase-js";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage-constants";

// Service-role client — bypasses RLS, so it only ever runs server-side
// (behind requireAdmin()), never shipped to the browser. Used solely to mint
// short-lived signed upload URLs; the actual file bytes go straight from the
// admin's browser to Supabase, never through this Next.js app.
function storageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

/**
 * Mints a one-time signed upload slot for a single object path. The caller
 * (browser) uploads directly to Supabase with the returned token — this
 * function never touches file bytes.
 */
export async function createSignedUploadUrl(path: string) {
  const { data, error } = await storageAdmin()
    .storage.from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Could not create upload URL.");

  const publicUrl = storageAdmin().storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data
    .publicUrl;

  return { signedUrl: data.signedUrl, token: data.token, path: data.path, publicUrl };
}
