import { describe, expect, it } from "vitest";
import { calculateShipping, estimatedDeliveryDays } from "./shipping";

describe("calculateShipping", () => {
  it("charges the Cairo/Giza rate", () => {
    expect(calculateShipping("Cairo", 500)).toBe(60);
    expect(calculateShipping("Giza", 500)).toBe(60);
  });

  it("charges the remote-governorate rate", () => {
    expect(calculateShipping("Red Sea", 500)).toBe(130);
    expect(calculateShipping("North Sinai", 500)).toBe(130);
  });

  it("charges the national rate elsewhere", () => {
    expect(calculateShipping("Alexandria", 500)).toBe(90);
  });

  it("is free at or above the threshold, everywhere", () => {
    expect(calculateShipping("Cairo", 2500)).toBe(0);
    expect(calculateShipping("Red Sea", 2500)).toBe(0);
    expect(calculateShipping("Alexandria", 999999)).toBe(0);
  });

  it("is not free just under the threshold", () => {
    expect(calculateShipping("Cairo", 2499)).toBe(60);
  });
});

describe("estimatedDeliveryDays", () => {
  it("returns the fast estimate for Cairo/Giza", () => {
    expect(estimatedDeliveryDays("Cairo")).toBe("1-2 days");
  });

  it("returns the slow estimate for remote governorates", () => {
    expect(estimatedDeliveryDays("South Sinai")).toBe("5-7 days");
  });

  it("returns the default estimate elsewhere", () => {
    expect(estimatedDeliveryDays("Alexandria")).toBe("2-4 days");
  });
});
