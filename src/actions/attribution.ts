"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "hustle_attribution";

export async function captureAttributionAction(source: string) {
  const jar = await cookies();
  if (jar.get(COOKIE_NAME)) return; // first-touch only — don't overwrite
  jar.set(COOKIE_NAME, source.slice(0, 60), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getAttributionSource(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
