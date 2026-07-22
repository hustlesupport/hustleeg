import "server-only";
import { getNotificationProvider } from "@/lib/notifications";

/**
 * Stable entry point used everywhere a notification needs to go out (order
 * confirmations, shipping updates, OTP codes, back-in-stock alerts, raffle
 * winners, admin new-order alerts). Delegates to whichever provider
 * src/lib/notifications picks — mock (console log) until real credentials
 * are configured, then a real one, with zero changes needed here or at any
 * call site.
 */
export async function sendNotification(to: { email?: string; phone?: string }, message: string) {
  return getNotificationProvider().send(to, message);
}
