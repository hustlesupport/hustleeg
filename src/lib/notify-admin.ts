import "server-only";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { sendNotification } from "@/lib/notify";

/**
 * Store-owner alerts (new order, etc.) — separate from sendNotification()
 * because these go to the merchant, not a customer, and Telegram (the
 * genuinely-free channel) is identified by a fixed chat_id rather than a
 * customer's phone/email. Falls back to ADMIN_ALERT_PHONE via the regular
 * SMS/WhatsApp provider if Telegram isn't configured.
 */
export async function notifyAdmin(message: string) {
  const telegramResult = await sendTelegramMessage(message);
  if (telegramResult.delivered) return telegramResult;

  const adminPhone = process.env.ADMIN_ALERT_PHONE;
  if (!adminPhone) return { delivered: false };
  return sendNotification({ phone: adminPhone }, message);
}
