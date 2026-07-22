import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "hustle_locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

export { LOCALE_COOKIE };
