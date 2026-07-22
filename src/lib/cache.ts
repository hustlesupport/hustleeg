import Redis from "ioredis";

// A single lazy-connecting Redis client, reused across hot reloads.
// If Redis is unreachable, every helper below degrades to "no cache" —
// callers always get a value, just without the speedup.
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createClient() {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't keep retrying a dead connection
  });
  client.on("error", () => {
    // Swallowed intentionally — cache is a speed optimization, not a dependency.
  });
  return client;
}

export const redis = globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

let connectAttempted = false;
async function ensureConnected() {
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
  if (redis.status !== "ready") return;
  try {
    await redis.del(...keys);
  } catch {
    // best-effort
  }
}

/** Invalidate every key matching a prefix, e.g. `product:*` after a bulk import. */
export async function invalidatePrefix(prefix: string) {
  if (redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    // best-effort
  }
}
