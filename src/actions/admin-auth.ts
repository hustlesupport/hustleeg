"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createAdminSession,
  destroyAdminSession,
  createPending2FA,
  getPending2FAUserId,
  clearPending2FA,
  requireAdmin,
} from "@/lib/admin-auth";
import { generateSecret, generateTotpUri, verifyTotp } from "@/lib/totp";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(input: z.infer<typeof loginSchema>): Promise<{ requiresTwoFactor: boolean }> {
  const { email, password } = loginSchema.parse(input);

  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.active) throw new Error("Invalid email or password.");

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) throw new Error("Invalid email or password.");

  if (admin.twoFactorEnabled) {
    await createPending2FA(admin.id);
    return { requiresTwoFactor: true };
  }

  await createAdminSession(admin.id);
  await db.auditLog.create({
    data: { adminUserId: admin.id, action: "LOGIN", entity: "AdminUser", entityId: admin.id },
  });
  return { requiresTwoFactor: false };
}

export async function verifyLoginTwoFactorAction(token: string) {
  const adminId = await getPending2FAUserId();
  if (!adminId) throw new Error("Session expired — sign in again.");

  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  if (!admin?.twoFactorSecret) throw new Error("Session expired — sign in again.");

  if (!verifyTotp(admin.twoFactorSecret, token)) throw new Error("Invalid code.");

  await clearPending2FA();
  await createAdminSession(admin.id);
  await db.auditLog.create({
    data: { adminUserId: admin.id, action: "LOGIN", entity: "AdminUser", entityId: admin.id },
  });
  return { ok: true };
}

export async function logoutAction() {
  await destroyAdminSession();
}

export async function startTwoFactorSetupAction() {
  const admin = await requireAdmin();
  const secret = generateSecret();
  await db.adminUser.update({ where: { id: admin.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
  return { secret, uri: generateTotpUri(secret, admin.email) };
}

export async function confirmTwoFactorSetupAction(token: string) {
  const admin = await requireAdmin();
  const fresh = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!fresh.twoFactorSecret) throw new Error("Start setup first.");
  if (!verifyTotp(fresh.twoFactorSecret, token)) throw new Error("Invalid code.");

  await db.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: true } });
  return { ok: true };
}

export async function disableTwoFactorAction() {
  const admin = await requireAdmin();
  await db.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
}
