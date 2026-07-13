import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDigestEmail } from '@/lib/email/digest-shell';

// ---------------------------------------------------------------------------
// /api/cron/pd-digest
//
// Weekly email to every program OWNER (Program Director). Surfaces the
// two action signals that drive PD work:
//   1. Residents who have been silent ≥ 14 d (no logged case).
//   2. EPAs in CC review backlog (PENDING_REVIEW for the cohort).
//   3. CC reviews still IN_PROGRESS that need finalising.
//
// Schedule: Monday 13:30 UTC (~ 8:30 AM ET, 30 min after the resident
// + attending digests so the PD's inbox has the latest signals).
// ---------------------------------------------------------------------------

export const maxDuration = 60;
export const runtime = 'nodejs';

const SILENT_DAYS = 14;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  let sent = 0;
  let skipped = 0;
  let errored = 0;

  try {
    // Find all OWNER memberships across every program.
    const owners = await db.programMember.findMany({
      where: { role: 'OWNER' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });

    for (const owner of owners) {
      try {
        const programId = owner.programId;
        const ownerUser = owner.user;
        if (!ownerUser?.email) {
          skipped++;
          continue;
        }

        const prefs = await db.userNotificationPreferences.findUnique({
          where: { userId: ownerUser.id },
        });
        if (prefs && prefs.weeklyPdDigest === false) {
          skipped++;
          continue;
        }
        if (prefs && prefs.emailEnabled === false) {
          skipped++;
          continue;
        }

        // Cohort = every member of the program except the OWNER themselves.
        const cohort = await db.programMember.findMany({
          where: { programId, NOT: { userId: ownerUser.id } },
          select: { userId: true, user: { select: { id: true, name: true } } },
        });
        const cohortIds = cohort.map((c) => c.userId);

        if (cohortIds.length === 0) {
          skipped++;
          continue;
        }

        const silentCutoff = new Date(Date.now() - SILENT_DAYS * 24 * 60 * 60 * 1000);

        const [latestCases, pendingObs, openCcReviews] = await Promise.all([
          // Latest case date per resident, to compute silent residents.
          db.caseLog.groupBy({
            by: ['userId'],
            where: { userId: { in: cohortIds } },
            _max: { caseDate: true },
          }),
          db.epaObservation.count({
            where: {
              userId: { in: cohortIds },
              status: 'PENDING_REVIEW',
            },
          }),
          db.cCReview.findMany({
            where: { programId, status: 'IN_PROGRESS' },
            select: {
              id: true,
              meetingDate: true,
              cycleLabel: true,
              resident: { select: { name: true } },
            },
            orderBy: { meetingDate: 'asc' },
            take: 5,
          }),
        ]);

        const lastCaseByUser = new Map<string, Date | null>();
        for (const r of latestCases) lastCaseByUser.set(r.userId, r._max.caseDate);
        const silent = cohort.filter((c) => {
          const last = lastCaseByUser.get(c.userId);
          if (!last) return true;
          return last < silentCutoff;
        });

        // Skip if there's nothing actionable — don't spam empty digests.
        if (silent.length === 0 && pendingObs === 0 && openCcReviews.length === 0) {
          skipped++;
          continue;
        }

        const firstName = ownerUser.name?.split(' ')[0] ?? 'Doctor';
        const sections = [];

        if (silent.length > 0) {
          sections.push({
            heading: `Silent residents (${silent.length})`,
            intro: `Residents in ${owner.program.name} with no logged case in ${SILENT_DAYS}+ days.`,
            bullets: silent.slice(0, 5).map((s) => {
              const last = lastCaseByUser.get(s.userId);
              const ageDays = last
                ? Math.round((Date.now() - last.getTime()) / (24 * 60 * 60 * 1000))
                : null;
              const name = s.user?.name ?? 'Unnamed resident';
              return ageDays
                ? `${name} — last case ${ageDays}d ago`
                : `${name} — no cases logged yet`;
            }),
            cta: { label: 'Open PD dashboard', href: '/pd-dashboard' },
          });
        }

        if (pendingObs > 0) {
          sections.push({
            heading: 'EPA review backlog',
            bullets: [
              `${pendingObs} EPA${pendingObs === 1 ? '' : 's'} pending sign-off across the cohort`,
            ],
            cta: { label: 'View all pending EPAs', href: '/pd-dashboard' },
          });
        }

        if (openCcReviews.length > 0) {
          sections.push({
            heading: `CC reviews open (${openCcReviews.length})`,
            bullets: openCcReviews.map((r) => {
              const meetingFmt = r.meetingDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const nm = r.resident?.name ?? 'Resident';
              return `${nm} — ${r.cycleLabel ?? 'CC Review'} · ${meetingFmt}`;
            }),
            cta: { label: 'Open CC dashboard', href: '/cc-reviews' },
          });
        }

        const summarySubject =
          silent.length > 0
            ? `${silent.length} resident${silent.length === 1 ? '' : 's'} silent — your weekly PD signal`
            : 'Your weekly PD signal — quiet week, things look good.';

        const digest = buildDigestEmail({
          eyebrow: 'PD weekly digest',
          subjectLead: summarySubject,
          greeting: `Hi Dr. ${firstName},`,
          sections,
          primaryCta: { label: 'Open PD dashboard', href: '/pd-dashboard' },
          unsubscribeUrl: '/settings/notifications#digest-emails',
          unsubscribeReason: `you're a Program Director on ${owner.program.name}`,
        });

        const ok = await sendEmail({
          to: ownerUser.email,
          subject: digest.subject,
          html: digest.html,
          text: digest.text,
        });
        if (ok) sent++;
        else errored++;
      } catch (err) {
        console.error(`[pd-digest] error for user ${owner.user?.id}:`, err);
        errored++;
      }
    }

    const ms = Date.now() - started;
    console.log(
      `[pd-digest] Done in ${ms}ms — sent=${sent} skipped=${skipped} errored=${errored}`,
    );
    return NextResponse.json({ sent, skipped, errored, ms });
  } catch (err) {
    console.error('[pd-digest] fatal:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
