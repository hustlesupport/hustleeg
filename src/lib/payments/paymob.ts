import type { PaymentGateway, ChargeResult } from "./types";

const BASE_URL = "https://accept.paymob.com/api";

/**
 * Paymob's standard flow: auth token -> order registration -> payment key
 * -> redirect the shopper to the hosted iframe. Card entry and 3-D Secure
 * happen on Paymob's side, so this can only ever return "pending" with a
 * redirect URL — final confirmation arrives via the webhook in
 * src/app/api/webhooks/paymob/route.ts, which is what actually marks the
 * order paid.
 *
 * Structured against Paymob's publicly documented integration flow, but
 * unverified against a live sandbox (no credentials available in this
 * build) — test against a real Paymob test account before relying on it.
 */
export const paymobGateway: PaymentGateway = {
  name: "paymob",
  async charge(input): Promise<ChargeResult> {
    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const iframeId = process.env.PAYMOB_IFRAME_ID;

    if (!apiKey || !integrationId || !iframeId) {
      return { status: "failed", reason: "Paymob is not configured (missing API key/integration/iframe id)." };
    }

    try {
      const authRes = await fetch(`${BASE_URL}/auth/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (!authRes.ok) return { status: "failed", reason: "Paymob authentication failed." };
      const { token: authToken } = (await authRes.json()) as { token: string };

      const amountCents = Math.round(input.amount * 100);

      const orderRes = await fetch(`${BASE_URL}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: input.currency,
          merchant_order_id: input.orderNumber,
          items: [],
        }),
      });
      if (!orderRes.ok) return { status: "failed", reason: "Paymob order registration failed." };
      const { id: paymobOrderId } = (await orderRes.json()) as { id: number };

      const [firstName, ...rest] = input.customerName.split(" ");
      const paymentKeyRes = await fetch(`${BASE_URL}/acceptance/payment_keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: paymobOrderId,
          currency: input.currency,
          integration_id: Number(integrationId),
          billing_data: {
            first_name: firstName || "Customer",
            last_name: rest.join(" ") || "Customer",
            email: input.customerEmail,
            phone_number: input.customerPhone,
            apartment: "NA",
            floor: "NA",
            street: "NA",
            building: "NA",
            city: "NA",
            country: "EG",
            state: "NA",
          },
        }),
      });
      if (!paymentKeyRes.ok) return { status: "failed", reason: "Paymob payment key request failed." };
      const { token: paymentToken } = (await paymentKeyRes.json()) as { token: string };

      return {
        status: "pending",
        providerReference: String(paymobOrderId),
        redirectUrl: `${BASE_URL}/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`,
      };
    } catch {
      return { status: "failed", reason: "Could not reach Paymob." };
    }
  },
};
