import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { sendEmail, buildEpaReviewEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications/create';

type RouteContext = { params: Promise<{ id: string }> };

// Links are long-lived. Attendings routinely sign weeks or months after the
// fact; a 24-hour expiry is incompatible with real residency workflows.
const TOKEN_TTL_DAYS = 365;

/**
 * POST /api/epa/observations/[id]/submit
 * Submits an EPA observation for review.
 *
 * Routing rule:
 * - If assessorEmail matches a Hippo user → link them as assessorUserId and
 *   the EPA appears in their in-app Sign-Off inbox. Email is still sent as a
 *   fallback.
 * - If no Hippo user matches → email-only with a 365-day signed link.
 * - If no assessorEmail → status becomes SUBMITTED (no review requested).
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

    if (observation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only submit observations in DRAFT status' },
        { status: 400 },
      );
    }

    if (observation.assessorEmail) {
      const attendingUser = await db.user.findUnique({
        where: { email: observation.assessorEmail.toLowerCase() },
        select: { id: true },
      });

      const linkedCase = observation.caseLogId
        ? await db.caseLog.findUnique({
            where: { id: observation.caseLogId },
            select: { procedureName: true, caseDate: true },
          })
        : null;

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });

      const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
      const channel = attendingUser ? 'in_app' : 'email';

      const [updated, notification] = await db.$transaction([
        db.epaObservation.update({
          where: { id },
          data: {
            status: 'PENDING_REVIEW',
            assessorUserId: attendingUser?.id ?? null,
          },
        }),
        db.attendingNotification.create({
          data: {
            epaObservationId: id,
            recipientEmail:   observation.assessorEmail,
            recipientName:    observation.assessorName,
            expiresAt,
            channel,
          },
        }),
      ]);

      const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://hippomedicine.com';
      const reviewUrl = `${appBase}/review/${notification.accessToken}`;
      const inAppUrl = `${appBase}/inbox`;

      const emailData = buildEpaReviewEmail({
        assessorName: observation.assessorName,
        assessorEmail: observation.assessorEmail,
        residentName: dbUser?.name || 'A resident',
        epaId: observation.epaId,
        epaTitle: observation.epaTitle,
        procedureName: linkedCase?.procedureName || observation.epaTitle,
        caseDate: linkedCase?.caseDate
          ? new Date(linkedCase.caseDate).toLocaleDateString('en-CA')
          : new Date(observation.observationDate).toLocaleDateString('en-CA'),
        reviewUrl,
        inAppUrl: attendingUser ? inAppUrl : undefined,
        isHippoUser: Boolean(attendingUser),
      });

      sendEmail({
        to: observation.assessorEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch((err) => {
        console.error('[submit] Email send failed (non-fatal):', err);
      });

      // In-app notification for the attending — only when they have a
      // Hippo account. Non-users are notified via the email above.
      if (attendingUser) {
        void createNotification({
          userId: attendingUser.id,
          type: 'epa.awaiting_review',
          title: `${dbUser?.name || 'A resident'} submitted an EPA`,
          body: `${observation.epaId} · ${observation.epaTitle}. Tap to review and sign.`,
          actionUrl: `/inbox?epa=${id}`,
          epaObservationId: id,
        }).catch(err => console.warn('[submit] in-app notify failed:', err));
      }

      void logAudit({
        userId: user.id,
        action: 'epa.update',
        entityType: 'EpaObservation',
        entityId: id,
        metadata: {
          transition: 'DRAFT→PENDING_REVIEW',
          channel,
          attendingIsHippoUser: Boolean(attendingUser),
          assessorUserId: attendingUser?.id ?? null,
        },
        req,
      });

      return NextResponse.json({
        ...updated,
        notification: {
          id: notification.id,
          accessToken: notification.accessToken,
          recipientEmail: notification.recipientEmail,
          reviewUrl,
          channel,
          expiresAt,
          inAppDelivered: Boolean(attendingUser),
        },
      });
    }

    const updated = await db.epaObservation.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[POST /api/epa/observations/[id]/submit]', err);
    return NextResponse.json({ error: 'Failed to submit observation' }, { status: 500 });
  }
}
