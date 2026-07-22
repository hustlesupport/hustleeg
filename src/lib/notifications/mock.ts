import type { NotificationProvider, NotificationResult } from "./types";

/** No SMS/WhatsApp provider connected — every call is just logged. */
export const mockNotificationProvider: NotificationProvider = {
  name: "mock",
  async send(to, message): Promise<NotificationResult> {
    console.log(`[notify:mock] -> ${to.email ?? to.phone ?? "unknown"}: ${message}`);
    return { delivered: false };
  },
};
