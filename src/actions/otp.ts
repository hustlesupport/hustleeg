"use server";

import { z } from "zod";
import { redis } from "@/lib/cache";
import { sendNotification } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_SEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function otpKey(phone: string) {
  return `otp:${phone}`;
}

export async function sendOtpAction(phone: string) {
  const parsed = z.string().min(8).parse(phone);

  const { allowed } = await checkRateLimit(`otp-send:${parsed}`, 1, OTP_SEND_COOLDOWN_SECONDS);
  if (!allowed) return { sent: false, reason: "Wait a minute before requesting another code." };

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

  // A 6-digit code is only ~1M combinations — without an attempt cap it's
  // brute-forceable well within its 5-minute TTL.
  const { allowed } = await checkRateLimit(
    `otp-verify:${parsedPhone}`,
    OTP_MAX_VERIFY_ATTEMPTS,
    OTP_TTL_SECONDS
  );
  if (!allowed) return { verified: false, reason: "Too many attempts — request a new code." };

  const stored = await redis.get(otpKey(parsedPhone));
  if (!stored) return { verified: false, reason: "Code expired — request a new one." };
  if (stored !== parsedCode) return { verified: false, reason: "Incorrect code." };

  await redis.del(otpKey(parsedPhone));
  return { verified: true };
}
