import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDigestEmail } from '@/lib/email/digest-shell';

// ---------------------------------------------------------------------------
// /api/cron/attending-digest
//
// Weekly email to every Hippo user who has at least one EPA observation
// pending their sign-off. The email lists oldest-first (because those
// are the ones the requesting resident is most stressed about) and
// links straight to /log/inbox so the attending can sign in two taps.
//
// Schedule: every Monday 12:00 UTC (~ 7-8 AM ET) — chosen so it lands
// during morning rounds when staff are catching up on overnight queues.
// Vercel Cron config in vercel.json. Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

export const maxDuration = 60;
export const runtime = 'nodejs';

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
    // Distinct attending userIds with at least one PENDING_REVIEW or
    // SUBMITTED observation routed to them. We only count observations
    // routed to a Hippo user (assessorUserId set); token-link
    // observations to non-Hippo attendings are handled separately by
    // AttendingNotification's reminder system.
    const pending = await db.epaObservation.groupBy({
      by: ['assessorUserId'],
      where: {
        status: { in: ['PENDING_REVIEW', 'SUBMITTED'] },
        assessorUserId: { not: null },
      },
      _count: { _all: true },
    });

    for (const row of pending) {
      const attendingId = row.assessorUserId!;
      try {
        const [user, prefs, observations] = await Promise.all([
          db.user.findUnique({
            where: { id: attendingId },
            select: { id: true, email: true, name: true },
          }),
          db.userNotificationPreferences.findUnique({
            where: { userId: attendingId },
          }),
          db.epaObservation.findMany({
            where: {
              assessorUserId: attendingId,
              status: { in: ['PENDING_REVIEW', 'SUBMITTED'] },
            },
            select: {
              id: true,
              epaId: true,
              epaTitle: true,
              observationDate: true,
              user: { select: { name: true } },
            },
            orderBy: { observationDate: 'asc' },
            take: 6,
          }),
        ]);

        if (!user?.email) {
          skipped++;
          continue;
        }
        if (prefs && prefs.weeklyAttendingDigest === false) {
          skipped++;
          continue;
        }
        if (prefs && prefs.emailEnabled === false) {
          skipped++;
          continue;
        }
        if (observations.length === 0) {
          skipped++;
          continue;
        }

        const total = row._count._all;
        const firstName = user.name?.split(' ')[0] ?? 'Doctor';
        const oldestAgeDays = Math.max(
          1,
          Math.round(
            (Date.now() - observations[0].observationDate.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        );

        const bullets = observations.slice(0, 5).map((o) => {
          const days = Math.round(
            (Date.now() - o.observationDate.getTime()) / (24 * 60 * 60 * 1000),
          );
          const residentName = o.user?.name ?? 'a resident';
          return `${o.epaId} · ${o.epaTitle} — ${residentName} · ${days}d ago`;
        });
        if (total > observations.length) {
          bullets.push(`+ ${total - observations.length} more in your inbox`);
        }

        const digest = buildDigestEmail({
          eyebrow: 'EPAs pending sign-off',
          subjectLead:
            total === 1
              ? `One EPA is waiting for your sign-off — oldest ${oldestAgeDays}d.`
              : `${total} EPAs are waiting for your sign-off — oldest ${oldestAgeDays}d.`,
          greeting: `Hi Dr. ${firstName},`,
          sections: [
            {
              heading: 'Awaiting your review',
              intro:
                'Each one was logged by a resident who needs your sign-off to count it toward their CBD progression.',
              bullets,
              cta: { label: 'Open the sign-off inbox', href: '/log' },
            },
          ],
          primaryCta: { label: 'Sign EPAs in Hippo', href: '/log' },
          unsubscribeUrl: '/settings/notifications#digest-emails',
          unsubscribeReason:
            'you have EPAs from residents pending your sign-off',
        });

        const ok = await sendEmail({
          to: user.email,
          subject: digest.subject,
          html: digest.html,
          text: digest.text,
        });
        if (ok) sent++;
        else errored++;
      } catch (err) {
        console.error(`[attending-digest] error for user ${attendingId}:`, err);
        errored++;
      }
    }

    const ms = Date.now() - started;
    console.log(
      `[attending-digest] Done in ${ms}ms — sent=${sent} skipped=${skipped} errored=${errored}`,
    );
    return NextResponse.json({ sent, skipped, errored, ms });
  } catch (err) {
    console.error('[attending-digest] fatal:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
