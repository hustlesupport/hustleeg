import type { NotificationProvider, NotificationResult } from "./types";
import { toE164Egypt } from "./phone";

/**
 * Twilio's Messages API — stable, well-documented REST endpoint. Sends
 * WhatsApp if TWILIO_WHATSAPP_FROM is set (format: "whatsapp:+1415...",
 * Twilio's sandbox number works for testing before WhatsApp Business
 * approval comes through), otherwise falls back to plain SMS via
 * TWILIO_SMS_FROM. Requires a phone number on the notification target —
 * email-only notifications are silently skipped (no email provider wired
 * up yet; add one behind this same interface when needed).
 */
export const twilioProvider: NotificationProvider = {
  name: "twilio",
  async send(to, message): Promise<NotificationResult> {
    if (!to.phone) return { delivered: false };

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
    const smsFrom = process.env.TWILIO_SMS_FROM;

    const toNumber = toE164Egypt(to.phone);
    const useWhatsapp = Boolean(whatsappFrom);
    const from = useWhatsapp ? whatsappFrom! : smsFrom;
    if (!from) return { delivered: false };

    const body = new URLSearchParams({
      To: useWhatsapp ? `whatsapp:${toNumber}` : toNumber,
      From: from,
      Body: message,
    });

    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (!res.ok) {
        console.error(`[notify:twilio] send failed (${res.status}):`, await res.text());
        return { delivered: false };
      }

      const data = (await res.json()) as { sid?: string };
      return { delivered: true, providerReference: data.sid };
    } catch (err) {
      console.error("[notify:twilio] request error:", err);
      return { delivered: false };
    }
  },
};
