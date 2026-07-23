import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  it("matches the HSTL-<stamp>-<random> shape", () => {
    expect(generateOrderNumber()).toMatch(/^HSTL-[0-9A-Z]+-[0-9A-Z]{4}$/);
  });

  it("does not repeat across calls", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
  });
});
