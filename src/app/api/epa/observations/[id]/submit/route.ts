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

/** What the caller needs to render an honest post-submit confirmation. */
interface DeliveryInfo {
  channel: 'in_app' | 'email' | 'none';
  emailSent: boolean;
  emailError?: string;
  reviewUrl?: string;
}

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
 *
 * Delivery is always reported truthfully in `delivery.emailSent` — the email
 * send is awaited (Resend's own domain-verification failures land here), and
 * the observation stays PENDING_REVIEW either way since the review link
 * itself keeps working even when the email never arrived.
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
      const isHippoUser = Boolean(attendingUser);
      const channel: 'in_app' | 'email' = isHippoUser ? 'in_app' : 'email';

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
        inAppUrl: isHippoUser ? inAppUrl : undefined,
        isHippoUser,
      });

      // Awaited on purpose — Resend's domain-verification rejections land
      // here, and the resident needs to know about them before they walk
      // away believing their attending was notified.
      const emailResult = await sendEmail({
        to: observation.assessorEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      // `attending_notifications.sentAt` is NOT NULL with a DB default of
      // now() (prisma/schema.prisma — out of scope for this change), so a
      // failed send can't be represented as sentAt = null. Instead, a failed
      // email-only send is recorded as channel "email_failed" so the
      // review-link/remind endpoints (and any future reporting) can tell a
      // real send apart from one Resend silently swallowed. In-app delivery
      // is unaffected by the fallback email's outcome.
      if (!isHippoUser && !emailResult.ok) {
        await db.attendingNotification.update({
          where: { id: notification.id },
          data: { channel: 'email_failed' },
        }).catch((err) => {
          console.warn('[submit] failed to mark notification channel as email_failed:', err);
        });
      }

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
          attendingIsHippoUser: isHippoUser,
          assessorUserId: attendingUser?.id ?? null,
          emailSent: emailResult.ok,
          emailError: emailResult.ok ? undefined : emailResult.reason,
        },
        req,
      });

      const delivery: DeliveryInfo = {
        channel,
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.reason,
        // The resident owns this observation, so they may see their own
        // link — always included whenever a notification/token exists.
        reviewUrl,
      };

      return NextResponse.json({
        ...updated,
        notification: {
          id: notification.id,
          accessToken: notification.accessToken,
          recipientEmail: notification.recipientEmail,
          reviewUrl,
          channel,
          expiresAt,
          inAppDelivered: isHippoUser,
        },
        delivery,
      });
    }

    const updated = await db.epaObservation.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    const delivery: DeliveryInfo = { channel: 'none', emailSent: false };

    return NextResponse.json({ ...updated, delivery });
  } catch (err) {
    console.error('[POST /api/epa/observations/[id]/submit]', err);
    return NextResponse.json({ error: 'Failed to submit observation' }, { status: 500 });
  }
}
