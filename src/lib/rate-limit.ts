import "server-only";
import { redis } from "@/lib/cache";

/**
 * Fixed-window attempt counter for brute-force-sensitive actions (login, OTP,
 * 2FA). Redis is optional in this project (see .env.example), so — like
 * `cached()` — this fails *open* on a down/unconfigured Redis: rate limiting
 * is defense-in-depth on top of bcrypt/TOTP, not the only thing standing
 * between an attacker and the account, and admins shouldn't get locked out
 * of their own dashboard because a cache add-on isn't provisioned.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (redis.status !== "ready") {
    try {
      await redis.connect();
    } catch {
      return { allowed: true, remaining: limit };
    }
  }
  if (redis.status !== "ready") return { allowed: true, remaining: limit };

  try {
    const rateLimitKey = `ratelimit:${key}`;
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
