import { describe, expect, it } from "vitest";
import { calculateShipping, estimatedDeliveryDays } from "./shipping";

// Cairo/Giza-only, flat rate — see the "temporarily" comment in shipping.ts.
// Restore the per-governorate cases here if/when shipping reopens nationwide.
describe("calculateShipping", () => {
  it("charges the flat Cairo/Giza rate", () => {
    expect(calculateShipping("Cairo", 500)).toBe(80);
    expect(calculateShipping("Giza", 500)).toBe(80);
  });

  it("is free at or above the threshold", () => {
    expect(calculateShipping("Cairo", 2500)).toBe(0);
    expect(calculateShipping("Giza", 999999)).toBe(0);
  });

  it("is not free just under the threshold", () => {
    expect(calculateShipping("Cairo", 2499)).toBe(80);
  });
});

describe("estimatedDeliveryDays", () => {
  it("returns the fast estimate for Cairo/Giza", () => {
    expect(estimatedDeliveryDays("Cairo")).toBe("1-2 days");
    expect(estimatedDeliveryDays("Giza")).toBe("1-2 days");
  });
});
