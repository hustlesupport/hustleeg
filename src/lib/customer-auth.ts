import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SESSION_COOKIE = "hustle_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createCustomerSession(customerId: string) {
  const token = await new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCustomerSessionId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentCustomer() {
  const id = await getCustomerSessionId();
  if (!id) return null;
  return db.customer.findUnique({ where: { id } });
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Not signed in.");
  return customer;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export async function generateMemberNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `HSTL-${randomCode(6)}`;
    const existing = await db.customer.findUnique({ where: { memberNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique member number.");
}

export async function generateReferralCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomCode(8);
    const existing = await db.customer.findUnique({ where: { referralCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique referral code.");
}
