import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SESSION_COOKIE = "hustle_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hour shift
const PENDING_2FA_COOKIE = "hustle_admin_pending_2fa";
const PENDING_2FA_TTL_SECONDS = 5 * 60;

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

export async function createAdminSession(adminUserId: string) {
  const token = await new SignJWT({ sub: adminUserId })
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

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Short-lived, password-verified-but-not-yet-2FA-confirmed state. */
export async function createPending2FA(adminUserId: string) {
  const token = await new SignJWT({ sub: adminUserId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_2FA_TTL_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(PENDING_2FA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PENDING_2FA_TTL_SECONDS,
    path: "/",
  });
}

export async function getPending2FAUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function clearPending2FA() {
  const jar = await cookies();
  jar.delete(PENDING_2FA_COOKIE);
}

export async function getAdminSessionUserId(): Promise<string | null> {
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

export async function getCurrentAdmin() {
  const userId = await getAdminSessionUserId();
  if (!userId) return null;
  return db.adminUser.findUnique({ where: { id: userId, active: true } });
}

export async function requireAdmin(minRole?: "OWNER" | "MANAGER") {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated.");
  if (minRole === "OWNER" && admin.role !== "OWNER") {
    throw new Error("Owner permission required.");
  }
  return admin;
}
