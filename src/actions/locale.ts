"use server";

import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/locale-cookie";

export async function setLocaleAction(locale: Locale) {
  if (!LOCALES.includes(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
