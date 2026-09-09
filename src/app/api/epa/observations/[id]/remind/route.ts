import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { sendEmail, buildEpaReviewEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

type RouteContext = { params: Promise<{ id: string }> };

const RATE_LIMIT_MS = 10 * 60 * 1000; // once per 10 minutes

interface DeliveryInfo {
  channel: 'in_app' | 'email' | 'none';
  emailSent: boolean;
  emailError?: string;
  reviewUrl?: string;
}

/**
 * POST /api/epa/observations/[id]/remind
 * Owner-only. Re-sends the review email for a PENDING_REVIEW observation.
 * Rate-limited to once per 10 minutes off `attending_notifications.sentAt`
 * (repurposed here as "last send attempt", since the column is NOT NULL and
 * can't hold a true null-until-sent semantic — see submit/route.ts).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;

    const observation = await db.epaObservation.findFirst({
      where: { id, userId: user.id },
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (observation.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Observation is not pending review' },
        { status: 400 },
      );
    }

    const notification = await db.attendingNotification.findFirst({
      where: { epaObservationId: id },
      orderBy: { sentAt: 'desc' },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'No review link exists for this observation yet' },
        { status: 404 },
      );
    }

    if (notification.respondedAt) {
      return NextResponse.json(
        { error: 'This observation has already been reviewed' },
        { status: 400 },
      );
    }

    const sinceLast = Date.now() - notification.sentAt.getTime();
    if (sinceLast < RATE_LIMIT_MS) {
      const waitMin = Math.ceil((RATE_LIMIT_MS - sinceLast) / 60000);
      return NextResponse.json(
        { error: `Please wait ${waitMin} more minute${waitMin === 1 ? '' : 's'} before sending another reminder.` },
        { status: 429 },
      );
    }

    const isHippoUser = notification.channel === 'in_app';

    const linkedCase = observation.caseLogId
      ? await db.caseLog.findUnique({
          where: { id: observation.caseLogId },
          select: { procedureName: true, caseDate: true },
        })
      : null;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://hippomedicine.com';
    const reviewUrl = `${appBase}/review/${notification.accessToken}`;
    const inAppUrl = `${appBase}/inbox`;

    const emailData = buildEpaReviewEmail({
      assessorName: notification.recipientName,
      assessorEmail: notification.recipientEmail,
      residentName: dbUser?.name || 'A resident',
      epaId: observation.epaId,
      epaTitle: observation.epaTitle,
      procedureName: linkedCase?.procedureName || observation.epaTitle,
      caseDate: linkedCase?.caseDate
        ? new Date(linkedCase.caseDate).toLocaleDateString('en-CA')
        : new Date(observation.observationDate).toLocaleDateString('en-CA'),
      reviewUrl,
      inAppUrl: isHippoUser ? inAppUrl : undefined,
      isHippoUser,
    });

    const emailResult = await sendEmail({
      to: notification.recipientEmail,
      subject: `Reminder: ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text,
    });

    await db.attendingNotification.update({
      where: { id: notification.id },
      data: {
        sentAt: new Date(),
        channel: isHippoUser ? 'in_app' : (emailResult.ok ? 'email' : 'email_failed'),
      },
    });

    void logAudit({
      userId: user.id,
      action: 'epa.update',
      entityType: 'EpaObservation',
      entityId: id,
      metadata: {
        transition: 'reminder-sent',
        notificationId: notification.id,
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.reason,
      },
      req,
    });

    const delivery: DeliveryInfo = {
      channel: isHippoUser ? 'in_app' : 'email',
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.reason,
      reviewUrl,
    };

    return NextResponse.json({ delivery });
  } catch (err) {
    console.error('[POST /api/epa/observations/[id]/remind]', err);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
