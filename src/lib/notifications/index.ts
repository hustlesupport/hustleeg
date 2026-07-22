import { mockNotificationProvider } from "./mock";
import { twilioProvider } from "./twilio";
import type { NotificationProvider } from "./types";

export type { NotificationTarget, NotificationResult, NotificationProvider } from "./types";

/**
 * Drop TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / (TWILIO_WHATSAPP_FROM or
 * TWILIO_SMS_FROM) into .env and every sendNotification() call across the
 * app — order confirmations, shipping updates, OTP codes, back-in-stock
 * alerts, raffle winners, admin new-order alerts — starts actually
 * delivering, with no other code changes.
 */
export function getNotificationProvider(): NotificationProvider {
  if (process.env.TWILIO_ACCOUNT_SID) return twilioProvider;
  return mockNotificationProvider;
}
