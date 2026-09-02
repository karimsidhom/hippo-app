import { NextRequest, NextResponse } from 'next/server';
import { doctorName } from '@/lib/names';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDigestEmail } from '@/lib/email/digest-shell';

/**
 * POST /api/cron/weekly-digest
 *
 * Sends a weekly digest email to all users who have opted in.
 * Called by Vercel Cron (see vercel.json) every Monday at 8 AM ET.
 *
 * Protected by CRON_SECRET — Vercel sets the Authorization header
 * automatically for cron-triggered requests.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ── Auth: only Vercel Cron or manual trigger with secret ────────────
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
    // Find all users who have opted in to the resident weekly digest.
    // We honour BOTH the legacy Profile.allowWeeklyDigest and the newer
    // UserNotificationPreferences.weeklyResidentDigest — either set to
    // false suppresses the email. This keeps existing opt-outs valid
    // while letting the new per-channel UI take precedence going forward.
    const profiles = await db.profile.findMany({
      where: { allowWeeklyDigest: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            notificationPreferences: {
              select: {
                emailEnabled: true,
                weeklyResidentDigest: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const profile of profiles) {
      const { user } = profile;
      if (!user.email) {
        skipped++;
        continue;
      }

      // Per-channel preferences take precedence over the legacy boolean.
      const prefs = user.notificationPreferences;
      if (prefs && prefs.weeklyResidentDigest === false) {
        skipped++;
        continue;
      }
      if (prefs && prefs.emailEnabled === false) {
        skipped++;
        continue;
      }

      try {
        // Gather weekly stats for this user
        const [casesThisWeek, pendingEpas, milestonesThisWeek] = await Promise.all([
          db.caseLog.count({
            where: { userId: user.id, caseDate: { gte: weekAgo } },
          }),
          db.epaObservation.count({
            where: {
              userId: user.id,
              status: { in: ['PENDING_REVIEW', 'SUBMITTED'] },
            },
          }),
          db.milestone.count({
            where: { userId: user.id, achievedAt: { gte: weekAgo } },
          }),
        ]);

        // Don't send empty digests — nothing to report
        if (casesThisWeek === 0 && pendingEpas === 0 && milestonesThisWeek === 0) {
          skipped++;
          continue;
        }

        const greetName = doctorName(user.name, 'Surgeon');
        const { subject, html, text } = renderResidentDigest({
          greetName,
          casesThisWeek,
          pendingEpas,
          milestonesThisWeek,
        });

        const ok = await sendEmail({ to: user.email, subject, html, text });
        if (ok) sent++;
        else errored++;
      } catch (err) {
        console.error(`[weekly-digest] Error for user ${user.id}:`, err);
        errored++;
      }
    }

    const ms = Date.now() - started;
    console.log(`[weekly-digest] Done in ${ms}ms — sent=${sent} skipped=${skipped} errored=${errored}`);

    return NextResponse.json({ sent, skipped, errored, ms });
  } catch (err) {
    console.error('[weekly-digest] Fatal error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// Also support GET for Vercel Cron (it sends GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}

// ── Resident-digest template ─────────────────────────────────────────
// Uses the shared digest shell so it inherits the same Hippo brand
// chrome (typography, colours, blur header band) as the attending /
// PD / CC-prep digests. The local helper below just collects the
// resident-specific bullets.

interface DigestData {
  greetName: string;
  casesThisWeek: number;
  pendingEpas: number;
  milestonesThisWeek: number;
}

function renderResidentDigest(data: DigestData): {
  subject: string;
  html: string;
  text: string;
} {
  const { greetName, casesThisWeek, pendingEpas, milestonesThisWeek } = data;

  const bullets: string[] = [];
  if (casesThisWeek > 0) {
    bullets.push(`${casesThisWeek} case${casesThisWeek === 1 ? '' : 's'} logged this week`);
  }
  if (pendingEpas > 0) {
    bullets.push(`${pendingEpas} EPA${pendingEpas === 1 ? '' : 's'} pending sign-off`);
  }
  if (milestonesThisWeek > 0) {
    bullets.push(`${milestonesThisWeek} new milestone${milestonesThisWeek === 1 ? '' : 's'} earned`);
  }

  const subjectLead = bullets[0] ?? 'Your weekly Hippo summary';

  return buildDigestEmail({
    eyebrow: 'Your week on Hippo',
    subjectLead: `Your week on Hippo: ${subjectLead}`,
    greeting: `Hi ${greetName},`,
    sections: [
      {
        heading: 'This week',
        bullets,
        cta: { label: 'See the full dashboard', href: '/dashboard' },
      },
    ],
    primaryCta: { label: 'Open Hippo', href: '/dashboard' },
    unsubscribeUrl: '/settings/notifications#digest-emails',
    unsubscribeReason: 'you opted into the weekly resident summary',
  });
}
