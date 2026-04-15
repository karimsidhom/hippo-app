/**
 * Lightweight in-memory rate limiter. Per-user sliding window using a
 * Map<userId, timestamps[]>. No external deps, no Redis.
 *
 * Trade-offs:
 *   - Single-instance correctness only. In a multi-region Vercel deploy
 *     each region has its own counter, so the effective limit is N * regions.
 *     For the current single-region CA deployment this is acceptable.
 *   - Resets on cold start. Again, acceptable given cost ceilings elsewhere
 *     (Anthropic per-key quotas, OpenAI per-key quotas).
 *   - When scaling out, swap this module's impl for @upstash/ratelimit against
 *     Vercel KV. Callers shouldn't need to change.
 *
 * Usage inside an API route:
 *
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 *   const rl = checkRateLimit(`ai:${user.id}`, { max: 10, windowMs: 60_000 });
 *   if (!rl.allowed) return rl.response;
 *   // ... proceed
 */

import { NextResponse } from "next/server";

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup — prevents the Map from growing unbounded when
// many short-lived keys are used. We prune stale entries every ~1000 calls.
let opsSinceCleanup = 0;
function cleanup(now: number) {
  opsSinceCleanup++;
  if (opsSinceCleanup < 1000) return;
  opsSinceCleanup = 0;
  for (const [k, v] of buckets) {
    // Drop any bucket with no hits in the last 10 minutes.
    const fresh = v.hits.filter((t) => now - t < 10 * 60_000);
    if (fresh.length === 0) buckets.delete(k);
    else v.hits = fresh;
  }
}

export interface RateLimitOptions {
  /** Maximum number of hits allowed in the window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  /** Pre-built 429 response if !allowed; do `return rl.response`. */
  response: NextResponse;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < opts.windowMs);

  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterMs = Math.max(0, opts.windowMs - (now - oldest));
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded. Please slow down.",
          code: "RATE_LIMITED",
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil(retryAfterMs / 1000)),
            "x-ratelimit-remaining": "0",
          },
        },
      ),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: opts.max - bucket.hits.length,
    retryAfterMs: 0,
    response: NextResponse.json({ ok: true }), // never read when allowed
  };
}

// Preset limits tuned for different endpoint classes.
export const LIMITS = {
  /** AI endpoints (preflight, draft, brief, debrief). Expensive + abusable. */
  ai: { max: 20, windowMs: 60_000 },
  /** Write endpoints (create case, comment, etc.). Protect against spam. */
  write: { max: 60, windowMs: 60_000 },
  /** Auth endpoints (login, signup, password). Protect against stuffing. */
  auth: { max: 10, windowMs: 60_000 },
} satisfies Record<string, RateLimitOptions>;
