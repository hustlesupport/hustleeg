import { mockGateway } from "./mock";
import { paymobGateway } from "./paymob";
import type { PaymentGateway } from "./types";

export type { ChargeInput, ChargeResult, PaymentGateway } from "./types";

/**
 * Drop PAYMOB_API_KEY / PAYMOB_INTEGRATION_ID / PAYMOB_IFRAME_ID into .env
 * and card checkout switches from sandbox mock to real Paymob — no other
 * code changes needed. Fawry/Kashier/Valu/Souhoola follow the same
 * PaymentGateway interface but aren't implemented yet; add them here
 * alongside Paymob when needed.
 */
export function getPaymentGateway(): PaymentGateway {
  if (process.env.PAYMOB_API_KEY) return paymobGateway;
  return mockGateway;
}
