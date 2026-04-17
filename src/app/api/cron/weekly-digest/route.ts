import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

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
    // Find all users who have opted in to the weekly digest
    const profiles = await db.profile.findMany({
      where: { allowWeeklyDigest: true },
      include: {
        user: { select: { id: true, email: true, name: true } },
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

        const firstName = user.name?.split(' ')[0] ?? 'Surgeon';
        const { subject, html, text } = buildDigestEmail({
          firstName,
          casesThisWeek,
          pendingEpas,
          milestonesThisWeek,
          specialty: profile.specialty ?? undefined,
          trainingYear: profile.trainingYearLabel ?? undefined,
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

// ── Email template ────────────────────────────────────────────────────

interface DigestData {
  firstName: string;
  casesThisWeek: number;
  pendingEpas: number;
  milestonesThisWeek: number;
  specialty?: string;
  trainingYear?: string;
}

function buildDigestEmail(data: DigestData): {
  subject: string;
  html: string;
  text: string;
} {
  const { firstName, casesThisWeek, pendingEpas, milestonesThisWeek } = data;

  // Build summary lines
  const lines: string[] = [];
  if (casesThisWeek > 0) {
    lines.push(`${casesThisWeek} case${casesThisWeek === 1 ? '' : 's'} logged this week`);
  }
  if (pendingEpas > 0) {
    lines.push(`${pendingEpas} EPA${pendingEpas === 1 ? '' : 's'} pending sign-off`);
  }
  if (milestonesThisWeek > 0) {
    lines.push(`${milestonesThisWeek} new milestone${milestonesThisWeek === 1 ? '' : 's'} earned`);
  }

  const subject = `Your week on Hippo: ${lines[0] ?? 'weekly summary'}`;

  const text = `Hi Dr. ${firstName},

Here's your weekly Hippo summary:

${lines.map(l => `- ${l}`).join('\n')}

Keep it up! Log into Hippo to see your full dashboard:
https://hippomedicine.com/dashboard

---
You're receiving this because you opted into weekly digests.
Turn it off anytime: https://hippomedicine.com/settings (Social tab)

— Hippo (hippomedicine.com)`;

  const statsHtml = lines
    .map(
      (l) =>
        `<tr><td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#cbd5e1;">${escapeHtml(l)}</td></tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e1520;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:24px;font-weight:700;color:#e2e8f0;letter-spacing:-0.5px;">
        Hippo
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Your Weekly Summary</div>
    </div>

    <div style="background:#141c28;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi Dr. ${escapeHtml(firstName)},
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Here&rsquo;s what happened on Hippo this week:
      </p>

      <table style="width:100%;border-collapse:collapse;background:#0e1520;border:1px solid rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;">
        ${statsHtml}
      </table>

      <a href="https://hippomedicine.com/dashboard" style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;margin-top:20px;">
        Open Dashboard
      </a>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="color:#475569;font-size:11px;margin:0;line-height:1.6;">
        You&rsquo;re receiving this because you opted into weekly digests.<br>
        <a href="https://hippomedicine.com/settings" style="color:#64748b;">Turn off</a> anytime in Settings &rarr; Social.
      </p>
      <p style="color:#475569;font-size:11px;margin:8px 0 0;">
        <a href="https://hippomedicine.com" style="color:#64748b;">Hippo</a> &mdash; surgical education, simplified.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
