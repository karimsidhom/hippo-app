import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

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

      return NextResponse.json({
        ...updated,
        notification: {
          id: notification.id,
          accessToken: notification.accessToken,
          recipientEmail: notification.recipientEmail,
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
