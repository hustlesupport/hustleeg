import type { CourierProvider, ShipmentResult } from "./types";

const BASE_URL = "https://app.bosta.co/api/v2";

/**
 * Structured against Bosta's publicly documented delivery-creation
 * endpoint, unverified against a live account (no credentials available in
 * this build) — test against Bosta's sandbox before relying on it.
 */
export const bostaCourier: CourierProvider = {
  name: "bosta",
  async createShipment(input): Promise<ShipmentResult> {
    const apiKey = process.env.BOSTA_API_KEY;
    if (!apiKey) throw new Error("Bosta is not configured (missing BOSTA_API_KEY).");

    const res = await fetch(`${BASE_URL}/deliveries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        type: 10, // standard delivery
        specs: { packageType: "Parcel" },
        cod: input.codAmount,
        dropOffAddress: {
          city: input.city,
          zone: input.area,
          district: input.governorate,
          firstLine: input.street,
        },
        receiver: {
          firstName: input.customerName,
          phone: input.customerPhone,
        },
        notes: `Hustle order ${input.orderNumber}`,
      }),
    });

    if (!res.ok) throw new Error(`Bosta delivery creation failed (${res.status}).`);
    const data = (await res.json()) as { data?: { trackingNumber?: string; _id?: string } };
    const trackingNumber = data.data?.trackingNumber ?? data.data?._id;
    if (!trackingNumber) throw new Error("Bosta response missing tracking number.");

    return {
      trackingNumber,
      trackingUrl: `https://bosta.co/tracking/${trackingNumber}`,
    };
  },
};
