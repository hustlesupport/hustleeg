import { kashierGateway } from "./kashier";
import { mockGateway } from "./mock";
import { paymobGateway } from "./paymob";
import type { PaymentGateway } from "./types";

export type { ChargeInput, ChargeResult, PaymentGateway } from "./types";

/**
 * Drop KASHIER_PAYMENT_KEY / KASHIER_SECRET_KEY or PAYMOB credentials into .env
 * and card checkout switches from sandbox mock to real provider — no other
 * code changes needed.
 */
export function getPaymentGateway(): PaymentGateway {
  if (process.env.KASHIER_PAYMENT_KEY || process.env.KASHIER_SECRET_KEY) return kashierGateway;
  if (process.env.PAYMOB_API_KEY) return paymobGateway;
  return mockGateway;
}
