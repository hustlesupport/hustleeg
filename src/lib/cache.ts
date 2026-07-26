import Redis from "ioredis";

// A single lazy-connecting Redis client, reused across hot reloads.
// If Redis is unreachable or REDIS_URL is not set, every helper degrades to "no cache".
const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null, // don't keep retrying a dead connection
    });
    client.on("error", () => {
      // Swallowed intentionally — cache is a speed optimization, not a dependency.
    });
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis !== undefined ? globalForRedis.redis : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

let connectAttempted = false;
async function ensureConnected() {
  if (!redis) return;
  if (connectAttempted) return;
  connectAttempted = true;
  try {
    await redis.connect();
  } catch {
    // Redis not available — cached() will fall through to the fetcher.
  }
}

/**
 * Cache-aside helper: read from Redis, fall back to `fetcher` on miss or
 * any Redis failure, and best-effort write the fresh value back with a TTL.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) return fetcher();

  await ensureConnected();

  if (redis.status === "ready") {
    try {
      const hit = await redis.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch {
      // fall through to fetcher
    }
  }

  const value = await fetcher();

  if (redis.status === "ready") {
    redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => {});
  }

  return value;
}

/** Invalidate one or more cache keys, e.g. after an admin write. */
export async function invalidate(...keys: string[]) {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.del(...keys);
  } catch {
    // best-effort
  }
}

/** Invalidate every key matching a prefix, e.g. `product:*` after a bulk import. */
export async function invalidatePrefix(prefix: string) {
  if (!redis || redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    // best-effort
  }
}
