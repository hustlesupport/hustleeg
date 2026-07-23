import { describe, expect, it } from "vitest";
import { generateSecret, generateTotp, verifyTotp, generateTotpUri } from "./totp";

describe("totp", () => {
  it("verifies a code generated from the same secret at the same time", () => {
    const secret = generateSecret();
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it("rejects a code from a different secret", () => {
    const code = generateTotp(generateSecret());
    expect(verifyTotp(generateSecret(), code)).toBe(false);
  });

  it("rejects a garbage code", () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("tolerates one step of clock drift", () => {
    const secret = generateSecret();
    const now = Date.now();
    const codeOneStepAhead = generateTotp(secret, now + 30_000);
    expect(verifyTotp(secret, codeOneStepAhead)).toBe(true);
  });

  it("builds a valid otpauth:// URI", () => {
    const uri = generateTotpUri("SECRET123", "owner@hustle.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=SECRET123");
  });
});
