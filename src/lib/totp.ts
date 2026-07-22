import "server-only";
import { randomBytes, createHmac } from "crypto";

// A from-scratch RFC 4226 (HOTP) / RFC 6238 (TOTP) implementation — no
// external dependency needed, works with Google Authenticator, Authy, etc.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(byteLength = 20): string {
  return base32Encode(randomBytes(byteLength));
}

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    output += BASE32_ALPHABET[parseInt(bits.slice(bits.length - remainder).padEnd(5, "0"), 2)];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function generateTotp(secret: string, time = Date.now(), stepSeconds = 30): string {
  const counter = Math.floor(time / 1000 / stepSeconds);
  return hotp(base32Decode(secret), counter);
}

/** Checks the token against a +/-1 step window to tolerate clock drift. */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const now = Date.now();
  for (let step = -window; step <= window; step++) {
    if (generateTotp(secret, now + step * 30_000) === token.trim()) return true;
  }
  return false;
}

export function generateTotpUri(secret: string, email: string, issuer = "Hustle Admin"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
