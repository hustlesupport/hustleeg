import "server-only";
import { cookies } from "next/headers";

const DISCOUNT_COOKIE = "hustle_discount_code";

export async function getAppliedDiscountCode(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DISCOUNT_COOKIE)?.value ?? null;
}

export async function setAppliedDiscountCode(code: string) {
  const jar = await cookies();
  jar.set(DISCOUNT_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function clearAppliedDiscountCode() {
  const jar = await cookies();
  jar.delete(DISCOUNT_COOKIE);
}
