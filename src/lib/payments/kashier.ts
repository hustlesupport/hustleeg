import { createHmac } from "crypto";
import type { PaymentGateway, ChargeResult } from "./types";

/**
 * Kashier Payment Gateway Integration (Egypt)
 *
 * KashierHosted Checkout flow:
 * 1. Generates an HMAC SHA256 hash using the Payment API Key:
 *    path = "/{merchantId}?mode={mode}&currency={currency}&orderId={orderId}&amount={amount}"
 * 2. Directs the customer to Kashier's hosted checkout page or iframe with the order hash.
 * 3. Secret key is used for server-side API calls to https://api.kashier.io and webhook authentication.
 */

export function generateKashierOrderHash(
  params: {
    merchantId: string;
    orderId: string;
    amount: number;
    currency: string;
    mode?: string;
  },
  apiKey: string
): string {
  const mode = params.mode || "live";
  const path = `/${params.merchantId}?mode=${mode}&currency=${params.currency}&orderId=${params.orderId}&amount=${params.amount}`;
  return createHmac("sha256", apiKey).update(path).digest("hex");
}

export function verifyKashierWebhookSignature(
  queryString: string,
  secretKey: string
): boolean {
  // Kashier webhooks send signature parameter computed via HMAC SHA256
  const params = new URLSearchParams(queryString);
  const signature = params.get("signature");
  if (!signature) return false;

  params.delete("signature");
  params.sort();
  const concatenated = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const computed = createHmac("sha256", secretKey).update(concatenated).digest("hex");
  return computed === signature;
}

export const kashierGateway: PaymentGateway = {
  name: "kashier",
  async charge(input): Promise<ChargeResult> {
    const paymentKey = process.env.KASHIER_PAYMENT_KEY;
    const secretKey = process.env.KASHIER_SECRET_KEY;
    const merchantId = process.env.KASHIER_MERCHANT_ID;
    const mode = process.env.KASHIER_MODE || "live";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!paymentKey || !secretKey) {
      return {
        status: "failed",
        reason: "Kashier is not configured (missing KASHIER_PAYMENT_KEY or KASHIER_SECRET_KEY).",
      };
    }

    if (!merchantId) {
      return {
        status: "failed",
        reason: "Kashier Merchant ID is missing (set KASHIER_MERCHANT_ID in .env).",
      };
    }

    try {
      const hash = generateKashierOrderHash(
        {
          merchantId,
          orderId: input.orderNumber,
          amount: input.amount,
          currency: input.currency,
          mode,
        },
        paymentKey
      );

      const redirectUrl = `https://checkout.kashier.io/?merchantId=${encodeURIComponent(
        merchantId
      )}&orderId=${encodeURIComponent(
        input.orderNumber
      )}&amount=${input.amount}&currency=${encodeURIComponent(
        input.currency
      )}&hash=${hash}&mode=${mode}&merchantRedirect=${encodeURIComponent(
        `${siteUrl}/orders/${input.orderNumber}`
      )}&serverWebhook=${encodeURIComponent(
        `${siteUrl}/api/webhooks/kashier`
      )}&customerName=${encodeURIComponent(
        input.customerName
      )}&customerEmail=${encodeURIComponent(input.customerEmail)}`;

      return {
        status: "pending",
        providerReference: input.orderNumber,
        redirectUrl,
      };
    } catch {
      return { status: "failed", reason: "Could not generate Kashier checkout URL." };
    }
  },
};
