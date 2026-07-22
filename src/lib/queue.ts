import "server-only";
import { redis } from "@/lib/cache";

// A launch-moment admission gate, not a full session-tracked waiting room:
// during the first few minutes after a campaign goes LIVE, page admissions
// are rate-limited per short time window via Redis. Over capacity means a
// "high demand" holding page that auto-retries a few seconds later — the
// same shape as a real waiting room, without needing persistent per-visitor
// session tracking. Fails open (admits everyone) if Redis is unavailable,
// same philosophy as the rest of the cache layer.

const CAPACITY_PER_WINDOW = 50;
const WINDOW_SECONDS = 5;
const LAUNCH_WINDOW_MS = 15 * 60_000;

export function isLaunchWindowActive(startAt: Date | null) {
  if (!startAt) return false;
  const elapsed = Date.now() - startAt.getTime();
  return elapsed >= 0 && elapsed < LAUNCH_WINDOW_MS;
}

export async function checkAdmission(campaignId: string): Promise<boolean> {
  if (redis.status !== "ready") return true;
  try {
    const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
    const key = `queue:${campaignId}:${bucket}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS * 2);
    return count <= CAPACITY_PER_WINDOW;
  } catch {
    return true;
  }
}
