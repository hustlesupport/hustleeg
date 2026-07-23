import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

/** Anon-key client — only ever used to push bytes to a signed upload URL the server already authorized. */
function browserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase Storage is not configured (missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).");
  }
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

/** Uploads a file straight from the browser to Supabase using a server-issued signed slot. */
export async function uploadToSignedUrl(bucket: string, path: string, token: string, file: File) {
  const { error } = await browserClient().storage.from(bucket).uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message);
}
