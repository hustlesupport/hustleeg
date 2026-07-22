/**
 * Telegram Bot API — genuinely free, no limits, no trial credit, no
 * business verification. Used specifically for admin alerts (new orders,
 * etc.), not customer-facing messages: Telegram delivery is tied to a
 * chat_id the store owner gets once by messaging their own bot, not to a
 * customer's phone number or email, so it doesn't fit the general
 * NotificationProvider interface used for customer notifications.
 */
export async function sendTelegramMessage(message: string): Promise<{ delivered: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { delivered: false };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      console.error(`[notify:telegram] send failed (${res.status}):`, await res.text());
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[notify:telegram] request error:", err);
    return { delivered: false };
  }
}
