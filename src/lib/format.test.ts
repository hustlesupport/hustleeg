import { describe, expect, it } from "vitest";
import { formatMoney, slugify, daysAgo } from "./format";

describe("formatMoney", () => {
  // Intl's currency formatter joins the code and amount with a non-breaking
  // space (U+00A0), not a regular one — match on content, not the raw string.
  it("formats a number as EGP with no decimals", () => {
    expect(formatMoney(1200)).toMatch(/^EGP\s1,200$/);
  });

  it("accepts a numeric string (as Prisma Decimal fields serialize)", () => {
    expect(formatMoney("1200")).toMatch(/^EGP\s1,200$/);
  });

  it("respects a different currency", () => {
    expect(formatMoney(50, "USD")).toBe("$50");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Foundations Tee")).toBe("foundations-tee");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Hustle & Co. — Drop #1!")).toBe("hustle-co-drop-1");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Édgy--  ")).toBe("dgy");
  });
});

describe("daysAgo", () => {
  it("returns a date in the past by the given number of days", () => {
    const result = daysAgo(1);
    const expected = Date.now() - 86_400_000;
    expect(Math.abs(result.getTime() - expected)).toBeLessThan(1000);
  });
});
