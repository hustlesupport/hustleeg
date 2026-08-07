import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { generateKashierOrderHash, kashierGateway } from "./kashier";

describe("Kashier Payment Gateway", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateKashierOrderHash", () => {
    it("generates correct HMAC SHA256 hash for order", () => {
      const apiKey = "7ad73907-2a57-40a5-9f13-69a6483d5e50";
      const hash = generateKashierOrderHash(
        {
          merchantId: "MID-1234",
          orderId: "ORD-1001",
          amount: 250,
          currency: "EGP",
          mode: "live",
        },
        apiKey
      );

      expect(hash).toBeTypeOf("string");
      expect(hash.length).toBe(64); // SHA-256 hex string is 64 characters
    });
  });

  describe("kashierGateway.charge", () => {
    it("returns failed status when credentials are missing", async () => {
      delete process.env.KASHIER_PAYMENT_KEY;
      delete process.env.KASHIER_SECRET_KEY;
      delete process.env.KASHIER_MERCHANT_ID;

      const result = await kashierGateway.charge({
        amount: 500,
        currency: "EGP",
        orderNumber: "ORD-999",
        customerEmail: "test@example.com",
        customerPhone: "01000000000",
        customerName: "Test User",
      });

      expect(result.status).toBe("failed");
    });

    it("returns pending status with checkout redirect URL when credentials are configured", async () => {
      process.env.KASHIER_PAYMENT_KEY = "7ad73907-2a57-40a5-9f13-69a6483d5e50";
      process.env.KASHIER_SECRET_KEY = "f33cca09a28c53aad0ac3b9c5879296f$68a78124a7d5e9abb944952cdac3b341e453910f91aed0fc7c6ae197affe79494da21d79161082fb14363d1ce4a12654";
      process.env.KASHIER_MERCHANT_ID = "MID-TEST";

      const result = await kashierGateway.charge({
        amount: 500,
        currency: "EGP",
        orderNumber: "ORD-1002",
        customerEmail: "user@example.com",
        customerPhone: "01280550333",
        customerName: "John Doe",
      });

      expect(result.status).toBe("pending");
      if (result.status === "pending") {
        expect(result.providerReference).toBe("ORD-1002");
        expect(result.redirectUrl).toContain("checkout.kashier.io");
        expect(result.redirectUrl).toContain("merchantId=MID-TEST");
        expect(result.redirectUrl).toContain("hash=");
      }
    });
  });
});
