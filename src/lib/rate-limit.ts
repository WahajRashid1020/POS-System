import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-log";

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// In-memory fixed window. On serverless hosting each instance keeps its own
// counters, so this is a best-effort brake on abuse, not a hard global limit.
// A shared store (Upstash/Vercel KV) or the host's firewall rules give a real one.
const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_TRACKED_KEYS) {
    buckets.forEach((bucket, k) => {
      if (bucket.resetAt <= now) buckets.delete(k);
    });
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}

function clientKey(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || "unknown"}`;
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function enforceRateLimit(
  req: NextRequest,
  route: string,
  options: { limit: number; windowMs: number; userId?: string },
): NextResponse | null {
  const result = checkRateLimit(
    `${route}:${clientKey(req, options.userId)}`,
    options.limit,
    options.windowMs,
  );
  if (result.allowed) return null;

  logSecurityEvent("rate_limit.exceeded", { route });
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
