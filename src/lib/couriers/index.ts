import { mockCourier } from "./mock";
import { bostaCourier } from "./bosta";
import type { CourierProvider } from "./types";

export type { ShipmentInput, ShipmentResult, CourierProvider } from "./types";

/**
 * Drop BOSTA_API_KEY into .env and fulfillment switches from a locally
 * generated tracking number to a real Bosta shipment — no other code
 * changes needed. Mylerz/Aramex/Egypt Post follow the same CourierProvider
 * interface but aren't implemented yet; add them here alongside Bosta.
 */
export function getCourierProvider(): CourierProvider {
  if (process.env.BOSTA_API_KEY) return bostaCourier;
  return mockCourier;
}
