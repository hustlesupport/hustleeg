import { describe, expect, it } from "vitest";
import { calculateShipping, estimatedDeliveryDays } from "./shipping";

// Cairo/Giza-only, flat rate — see the "temporarily" comment in shipping.ts.
// Restore the per-governorate cases here if/when shipping reopens nationwide.
describe("calculateShipping", () => {
  it("charges the flat Cairo/Giza rate", () => {
    expect(calculateShipping("Cairo", 500)).toBe(40);
    expect(calculateShipping("Giza", 500)).toBe(40);
  });

  it("charges the Alexandria rate of 50", () => {
    expect(calculateShipping("Alexandria", 500)).toBe(50);
  });

  it("is free at or above the threshold", () => {
    expect(calculateShipping("Cairo", 2500)).toBe(0);
    expect(calculateShipping("Giza", 999999)).toBe(0);
    expect(calculateShipping("Alexandria", 2500)).toBe(0);
  });

  it("is not free just under the threshold", () => {
    expect(calculateShipping("Cairo", 2499)).toBe(40);
    expect(calculateShipping("Alexandria", 2499)).toBe(50);
  });
});

describe("estimatedDeliveryDays", () => {
  it("returns 4-7 days estimate for all places", () => {
    expect(estimatedDeliveryDays("Cairo")).toBe("4-7 days");
    expect(estimatedDeliveryDays("Giza")).toBe("4-7 days");
    expect(estimatedDeliveryDays("Alexandria")).toBe("4-7 days");
  });
});

