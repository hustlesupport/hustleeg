"use server";

import { z } from "zod";
import { redis } from "@/lib/cache";
import { sendNotification } from "@/lib/notify";

const OTP_TTL_SECONDS = 5 * 60;

function otpKey(phone: string) {
  return `otp:${phone}`;
}

export async function sendOtpAction(phone: string) {
  const parsed = z.string().min(8).parse(phone);
  const code = String(Math.floor(100000 + Math.random() * 900000));

  if (redis.status === "ready") {
    await redis.set(otpKey(parsed), code, "EX", OTP_TTL_SECONDS);
  }

  await sendNotification({ phone: parsed }, `Your Hustle verification code is ${code}`);

  // Mock mode only — a real SMS provider means shoppers get this on their
  // phone instead. Never return the code in production.
  return { sent: true, devCode: process.env.NODE_ENV === "production" ? undefined : code };
}

export async function verifyOtpAction(phone: string, code: string) {
  const parsedPhone = z.string().min(8).parse(phone);
  const parsedCode = z.string().length(6).parse(code);

  if (redis.status !== "ready") {
    // Redis is required to actually verify a code; fail closed here so a
    // down cache can't be used to bypass verification.
    return { verified: false, reason: "Verification is temporarily unavailable." };
  }

  const stored = await redis.get(otpKey(parsedPhone));
  if (!stored) return { verified: false, reason: "Code expired — request a new one." };
  if (stored !== parsedCode) return { verified: false, reason: "Incorrect code." };

  await redis.del(otpKey(parsedPhone));
  return { verified: true };
}
