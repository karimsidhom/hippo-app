import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { sendEmail, buildEpaReviewEmail } from '@/lib/email';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/epa/observations/[id]/submit
 * Submits an EPA observation for review.
 * - If no assessorEmail → status becomes SUBMITTED
 * - If assessorEmail is set → status becomes PENDING_REVIEW and an
 *   AttendingNotification record is created with a unique accessToken.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
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
      // Fetch the linked case for email context
      const linkedCase = observation.caseLogId
        ? await db.caseLog.findUnique({
            where: { id: observation.caseLogId },
            select: { procedureName: true, caseDate: true },
          })
        : null;

      // Get resident's name for the email
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });

      // Create notification and set PENDING_REVIEW
      const [updated, notification] = await db.$transaction([
        db.epaObservation.update({
          where: { id },
          data: { status: 'PENDING_REVIEW' },
        }),
        db.attendingNotification.create({
          data: {
            epaObservationId: id,
            recipientEmail:   observation.assessorEmail,
            recipientName:    observation.assessorName,
          },
        }),
      ]);

      // Build the review URL
      const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://hippomedicine.com';
      const reviewUrl = `${appBase}/review/${notification.accessToken}`;

      // Send email notification (non-blocking — don't fail the submission if email fails)
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
      });

      // Fire and forget — email failure should not block the response
      sendEmail({
        to: observation.assessorEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch((err) => {
        console.error('[submit] Email send failed (non-fatal):', err);
      });

      return NextResponse.json({
        ...updated,
        notification: {
          id: notification.id,
          accessToken: notification.accessToken,
          recipientEmail: notification.recipientEmail,
          reviewUrl,
        },
      });
    }

    // No assessor email — just mark as SUBMITTED
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
