// ---------------------------------------------------------------------------
// Per-user daily AI quota
//
// Every AI endpoint (brief, voice-log, epa/ai-suggest, epa/oscore-suggest)
// shares a single upstream Gemini account. Without a per-user budget, a
// single heavy user can burn through the day's quota and leave every other
// Hippo user staring at timeouts.
//
// This module gives every user their own DAILY_LIMIT of AI calls. Usage is
// counted via AuditLog entries with `action = "ai.call"`, so there's no
// schema migration and the same log powers usage analytics later.
//
// Decisions:
//   • Daily window (midnight local-UTC) — resets predictably, no sliding.
//   • Soft cap — once exceeded, the endpoint returns 429 with a friendly
//     "reset at midnight UTC" message. The user is never locked out of
//     the app, only the AI feature.
//   • Cheap operations (fallback-only paths, cache hits) can opt out of
//     counting. Only real provider calls consume quota.
// ---------------------------------------------------------------------------

import { db } from "@/lib/db";

/**
 * Calls per user per day. Generous enough that a motivated resident
 * logging 20 cases and brieng 10 of them still has headroom, but tight
 * enough that a single user running the AI in a loop can't starve the
 * cohort.
 */
export const DAILY_AI_LIMIT = 50;

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
  /** Seconds until the daily window resets. Useful for UI countdowns. */
  resetsInSeconds: number;
}

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function secondsUntilNextUtcDay(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
    ),
  );
  return Math.max(0, Math.round((tomorrow.getTime() - now.getTime()) / 1000));
}

/**
 * Check (without incrementing) whether the user is under their daily AI
 * quota. Returns the current usage, the limit, and the seconds until the
 * window resets.
 */
export async function checkAiQuota(userId: string): Promise<QuotaCheck> {
  const used = await db.auditLog.count({
    where: {
      userId,
      action: "ai.call",
      createdAt: { gte: startOfUtcDay() },
    },
  });
  return {
    allowed: used < DAILY_AI_LIMIT,
    used,
    limit: DAILY_AI_LIMIT,
    resetsInSeconds: secondsUntilNextUtcDay(),
  };
}

/**
 * Record a successful AI call against the user's daily budget. Fire and
 * forget — a failed log write should never break the user-facing
 * response. Callers should `void` this and continue.
 */
export function recordAiCall(
  userId: string,
  feature: "brief" | "voice-log" | "epa-suggest" | "oscore-suggest" | "dictation",
  metadata?: Record<string, unknown>,
): void {
  db.auditLog
    .create({
      data: {
        userId,
        action: "ai.call",
        entityType: "AI",
        entityId: null,
        metadata: { feature, ...(metadata ?? {}) },
      },
    })
    .catch((err: unknown) => {
      console.warn(`[ai-quota] failed to record ${feature} usage:`, err);
    });
}

/**
 * Shorthand for endpoints: check the quota, and if the user is over,
 * return a pre-built NextResponse-compatible body + status code. Avoids
 * repeating the 429 boilerplate in every AI route.
 */
export async function requireAiQuota(
  userId: string,
): Promise<{ ok: true } | { ok: false; body: QuotaErrorBody; status: 429 }> {
  const check = await checkAiQuota(userId);
  if (check.allowed) return { ok: true };
  return {
    ok: false,
    status: 429,
    body: {
      error: "ai_quota_exceeded",
      message: `You've used ${check.used} of your ${check.limit} AI requests for today. The limit resets at midnight UTC.`,
      used: check.used,
      limit: check.limit,
      resetsInSeconds: check.resetsInSeconds,
    },
  };
}

export interface QuotaErrorBody {
  error: "ai_quota_exceeded";
  message: string;
  used: number;
  limit: number;
  resetsInSeconds: number;
}
