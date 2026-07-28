type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory sliding window limiter. Returns true when the request is
 * allowed. Per-instance only (fine for single-node / low-traffic admin login).
 */
export function allowAttempt(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number = Date.now(),
): boolean {
  const existing = buckets.get(key);
  if (!existing || nowMs >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  buckets.set(key, { count: existing.count + 1, resetAt: existing.resetAt });
  return true;
}

/** Test helper: clear all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}
