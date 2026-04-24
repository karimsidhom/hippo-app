import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/cron/keepalive
 *
 * Nudges Supabase Postgres so the project doesn't pause after 7 days of
 * free-tier inactivity. Supabase pauses projects where no database query
 * has hit in a week — if you're on the hobby/free plan and this app is
 * quiet for a stretch (e.g. early user testing, holidays, dev break),
 * your next visit will be greeted with a "project is paused, click to
 * resume" screen that takes 30-60 seconds to wake up.
 *
 * One trivial query every ~6 days is enough to reset the counter. We
 * schedule this twice-weekly (Tue + Fri) so even if one invocation is
 * missed (Vercel rare hiccup), the other catches the deadline.
 *
 * The query is deliberately minimal — SELECT 1 would suffice, but
 * counting a small table gives us a readable log line we can sanity
 * check ("keepalive ok — 42 users"). Adds no write load, no PHI.
 *
 * Not needed if you're on Supabase Pro — that plan never pauses. If
 * you upgrade, delete this file and the corresponding vercel.json entry.
 *
 * Protected by CRON_SECRET (same pattern as weekly-digest).
 */

export const maxDuration = 30;

async function handle(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  try {
    // Two reads from separate tables so both are touched. Supabase
    // pauses on database-level inactivity so any query would do — we
    // pick the users table (guaranteed non-empty) plus notifications
    // (the newest table, confirms migrations applied).
    const [userCount, notifCount] = await Promise.all([
      db.user.count(),
      db.notification.count(),
    ]);
    return NextResponse.json({
      ok: true,
      users: userCount,
      notifications: notifCount,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    // A keepalive FAILING is actually useful signal — means the DB is
    // already paused or the connection is misconfigured. Surface loudly
    // in logs so you notice.
    // eslint-disable-next-line no-console
    console.error("[cron/keepalive] db query failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

// Vercel Cron fires GET by default, but POST works too. Accept both so
// you can curl this manually from your laptop without faffing with
// methods.
export async function GET(req: NextRequest)  { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
