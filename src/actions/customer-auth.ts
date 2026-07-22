"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createCustomerSession,
  destroyCustomerSession,
  generateMemberNumber,
  generateReferralCode,
} from "@/lib/customer-auth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8).optional(),
  referralCode: z.string().optional(),
});

export async function registerAction(input: z.infer<typeof registerSchema>) {
  const data = registerSchema.parse(input);

  const existing = await db.customer.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("An account with this email already exists.");

  let referredByCustomerId: string | null = null;
  let referredByCode: string | null = null;
  if (data.referralCode) {
    const referrer = await db.customer.findUnique({ where: { referralCode: data.referralCode } });
    if (referrer) {
      referredByCustomerId = referrer.id;
      referredByCode = referrer.referralCode;
    }
  }

  const [memberNumber, referralCode, passwordHash] = await Promise.all([
    generateMemberNumber(),
    generateReferralCode(),
    hashPassword(data.password),
  ]);

  const customer = await db.customer.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      memberNumber,
      referralCode,
      referredByCustomerId,
      referredByCode,
    },
  });

  await createCustomerSession(customer.id);
  return { ok: true };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function customerLoginAction(input: z.infer<typeof loginSchema>) {
  const { email, password } = loginSchema.parse(input);

  const customer = await db.customer.findUnique({ where: { email } });
  if (!customer) throw new Error("Invalid email or password.");

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) throw new Error("Invalid email or password.");

  await createCustomerSession(customer.id);
  return { ok: true };
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
}
