import type { PaymentGateway, ChargeResult } from "./types";

/** Sandbox gateway — always succeeds, no external calls, no keys required. */
export const mockGateway: PaymentGateway = {
  name: "mock",
  async charge(input): Promise<ChargeResult> {
    console.log(`[payments:mock] charging ${input.amount} ${input.currency} for ${input.orderNumber}`);
    return { status: "succeeded", providerReference: `MOCK-${Date.now()}` };
  },
};
