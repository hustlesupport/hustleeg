import type { CourierProvider, ShipmentResult } from "./types";

/** No courier API connected — hands back a locally-generated tracking number. */
export const mockCourier: CourierProvider = {
  name: "mock",
  async createShipment(input): Promise<ShipmentResult> {
    console.log(`[courier:mock] creating shipment for ${input.orderNumber}`);
    return { trackingNumber: `HSTL-TRK-${Date.now().toString(36).toUpperCase()}` };
  },
};
