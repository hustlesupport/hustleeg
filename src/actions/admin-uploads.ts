"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createSignedUploadUrl } from "@/lib/supabase-storage";

const filenameSchema = z.string().min(1).max(200);

function sanitizeExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return ext.length > 0 && ext.length <= 10 ? ext : "bin";
}

export async function createProductImageUploadUrlAction(filename: string) {
  await requireAdmin();
  const parsed = filenameSchema.parse(filename);

  const ext = sanitizeExtension(parsed);
  const path = `products/${crypto.randomUUID()}.${ext}`;

  return createSignedUploadUrl(path);
}
