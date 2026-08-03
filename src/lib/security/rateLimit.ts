import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  backend: "upstash" | "memory";
};

type MemoryBucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, MemoryBucket>();

const upstashLimiters = new Map<string, Ratelimit>();

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getUpstashLimiter(
  namespace: string,
  options: RateLimitOptions,
): Ratelimit {
  const cacheKey = `${namespace}:${options.limit}:${options.windowMs}`;
  const existing = upstashLimiters.get(cacheKey);
  if (existing) {
    return existing;
  }
  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(options.limit, `${windowSec} s`),
    prefix: `eph:rl:${namespace}`,
    analytics: false,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

function checkMemory(
  key: string,
  options: RateLimitOptions,
  nowMs = Date.now(),
): RateLimitDecision {
  const existing = memoryBuckets.get(key);
  if (!existing || nowMs >= existing.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: nowMs + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      backend: "memory",
    };
  }
  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, backend: "memory" };
  }
  const next = existing.count + 1;
  memoryBuckets.set(key, { count: next, resetAt: existing.resetAt });
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - next),
    backend: "memory",
  };
}

/**
 * Durable rate limit when Upstash is configured; otherwise in-memory (local/dev).
 * Production readiness requires Upstash so multi-instance limits are consistent.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitDecision> {
  const key = `${namespace}:${identifier}`;
  if (!upstashConfigured()) {
    return checkMemory(key, options);
  }

  try {
    const result = await getUpstashLimiter(namespace, options).limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      backend: "upstash",
    };
  } catch (error) {
    console.error("[rateLimit] Upstash error; failing closed", error);
    return { allowed: false, remaining: 0, backend: "upstash" };
  }
}

/** Common presets used by API routes. */
export const RATE_LIMITS = {
  checkout: { limit: 20, windowMs: 10 * 60_000 },
  orderStatus: { limit: 60, windowMs: 60_000 },
  adminLogin: { limit: 10, windowMs: 15 * 60_000 },
  /** Generous: Bankful may retry bursts. */
  bankfulIpn: { limit: 120, windowMs: 60_000 },
  adminRefund: { limit: 30, windowMs: 10 * 60_000 },
  adminInventory: { limit: 60, windowMs: 10 * 60_000 },
  adminFulfillment: { limit: 60, windowMs: 10 * 60_000 },
  /** Restock notify form on product pages. */
  stockNotify: { limit: 10, windowMs: 10 * 60_000 },
  /** Public stock lookups for cart/product add controls. */
  availability: { limit: 120, windowMs: 60_000 },
} as const;

export function resetMemoryRateLimits(): void {
  memoryBuckets.clear();
}

export function tooManyRequestsResponse(
  message = "Too many requests. Try again later.",
): Response {
  return Response.json({ error: message }, { status: 429 });
}
