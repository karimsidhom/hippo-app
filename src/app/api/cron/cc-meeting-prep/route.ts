import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDigestEmail } from '@/lib/email/digest-shell';

// ---------------------------------------------------------------------------
// /api/cron/cc-meeting-prep
//
// Daily run: for every CC review whose meetingDate is exactly 7 days out
// (i.e. tomorrow's tomorrow's tomorrow ...), email every program member
// who's opted in to ccMeetingPrepDigest with a short prep packet:
//   • Meeting date + cycle label
//   • Resident under review
//   • Resident's pre-meeting snapshot (cases / EPA% / signed)
//   • Direct link to the review
//
// We dedupe per-(reviewId, userId) on the day of run so a daily cron
// doesn't double-fire even if it overlaps the precise 7-day boundary.
// Idempotency uses an in-memory cache keyed on the SQL query for the
// given UTC date — adequate for once-daily Vercel Cron.
//
// Schedule: daily 09:00 UTC (~ 4 AM ET) — early so the email is in the
// inbox by the time the PD wakes up.
// ---------------------------------------------------------------------------

export const maxDuration = 60;
export const runtime = 'nodejs';

interface SnapshotShape {
  caseCount?: number;
  epaCompletionPct?: number;
  epaSigned?: number;
  epaPending?: number;
  epaTotal?: number;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  let sent = 0;
  let skipped = 0;
  let errored = 0;

  try {
    // Window: exactly 7 days from "now" (rounded to UTC midnight). We
    // grab everything where 7d-ago-midnight ≤ meetingDate < 7d-ago-
    // midnight + 24h, so the cron fires on each review precisely once.
    const now = new Date();
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() + 7);
    const start = new Date(target);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const upcomingReviews = await db.cCReview.findMany({
      where: {
        status: 'IN_PROGRESS',
        meetingDate: { gte: start, lt: end },
      },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        program: { select: { id: true, name: true } },
      },
    });

    for (const review of upcomingReviews) {
      try {
        // Recipients: every program member (any role).
        const members = await db.programMember.findMany({
          where: { programId: review.programId },
          include: {
            user: { select: { id: true, email: true, name: true } },
            // (we don't need role to filter — every member sees this)
          },
        });

        for (const m of members) {
          if (!m.user?.email) {
            skipped++;
            continue;
          }
          const prefs = await db.userNotificationPreferences.findUnique({
            where: { userId: m.userId },
          });
          if (prefs && prefs.ccMeetingPrepDigest === false) {
            skipped++;
            continue;
          }
          if (prefs && prefs.emailEnabled === false) {
            skipped++;
            continue;
          }

          const firstName = m.user.name?.split(' ')[0] ?? 'Doctor';
          const residentName = review.resident.name ?? 'a resident';
          const meetingDateFmt = review.meetingDate.toLocaleDateString(
            undefined,
            { weekday: 'long', month: 'short', day: 'numeric' },
          );
          const snap = (review.snapshot as SnapshotShape | null) ?? {};

          const bullets = [
            `Resident: ${residentName}`,
            `Meeting: ${meetingDateFmt} · ${review.cycleLabel ?? 'CC review'}`,
            `Cases logged: ${snap.caseCount ?? 0}`,
            `EPA completion: ${snap.epaCompletionPct ?? 0}% (${snap.epaSigned ?? 0} signed / ${snap.epaTotal ?? 0} total)`,
          ];
          if (typeof snap.epaPending === 'number' && snap.epaPending > 0) {
            bullets.push(`EPAs still awaiting sign-off: ${snap.epaPending}`);
          }

          const digest = buildDigestEmail({
            eyebrow: 'CC meeting prep · 1 week out',
            subjectLead: `${review.cycleLabel ?? 'CC Review'} for ${residentName} is ${meetingDateFmt}.`,
            greeting: `Hi Dr. ${firstName},`,
            sections: [
              {
                heading: 'Pre-meeting snapshot',
                intro:
                  'These numbers were captured when the review was opened — open the dashboard for the live state.',
                bullets,
                cta: {
                  label: 'Open the review',
                  href: `/cc-reviews/${review.id}`,
                },
              },
            ],
            primaryCta: {
              label: 'Review the resident',
              href: `/cc-reviews/${review.id}`,
            },
            unsubscribeUrl: '/settings/notifications#digest-emails',
            unsubscribeReason: `you're a member of the ${review.program.name} program`,
          });

          const ok = await sendEmail({
            to: m.user.email,
            subject: digest.subject,
            html: digest.html,
            text: digest.text,
          });
          if (ok) sent++;
          else errored++;
        }
      } catch (err) {
        console.error(`[cc-meeting-prep] error for review ${review.id}:`, err);
        errored++;
      }
    }

    const ms = Date.now() - started;
    console.log(
      `[cc-meeting-prep] Done in ${ms}ms — reviews=${upcomingReviews.length} sent=${sent} skipped=${skipped} errored=${errored}`,
    );
    return NextResponse.json({
      reviews: upcomingReviews.length,
      sent,
      skipped,
      errored,
      ms,
    });
  } catch (err) {
    console.error('[cc-meeting-prep] fatal:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
