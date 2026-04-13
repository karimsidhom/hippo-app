import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ token: string }> };

/**
 * GET /api/epa/review/[token]
 * Public route — no auth required.
 * Looks up an AttendingNotification by accessToken, includes the EpaObservation.
 * Marks viewedAt on first view.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    const notification = await db.attendingNotification.findUnique({
      where: { accessToken: token },
      include: {
        epaObservation: {
          include: {
            caseLog: {
              select: {
                id: true,
                procedureName: true,
                caseDate: true,
                surgicalApproach: true,
              },
            },
          },
        },
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Mark viewedAt on first view
    if (!notification.viewedAt) {
      await db.attendingNotification.update({
        where: { id: notification.id },
        data: { viewedAt: new Date() },
      });
    }

    return NextResponse.json({
      notification: {
        id: notification.id,
        recipientEmail: notification.recipientEmail,
        recipientName: notification.recipientName,
        viewedAt: notification.viewedAt ?? new Date(),
        respondedAt: notification.respondedAt,
      },
      observation: notification.epaObservation,
    });
  } catch (err) {
    console.error('[GET /api/epa/review/[token]]', err);
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 });
  }
}

const ReviewActionSchema = z.object({
  action:         z.enum(['sign', 'return']),
  signedByName:   z.string().optional(),
  returnedReason: z.string().optional(),
});

/**
 * POST /api/epa/review/[token]
 * Public route — attending submits their review.
 * - action "sign": sets observation status → SIGNED, records signedAt and signedByName
 * - action "return": sets observation status → RETURNED, records returnedReason
 * Marks notification respondedAt.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    const notification = await db.attendingNotification.findUnique({
      where: { accessToken: token },
      include: { epaObservation: true },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (notification.respondedAt) {
      return NextResponse.json(
        { error: 'This review has already been submitted' },
        { status: 400 },
      );
    }

    const observation = notification.epaObservation;

    if (observation.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Observation is not pending review' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { action, signedByName, returnedReason } = ReviewActionSchema.parse(body);

    if (action === 'sign') {
      const [updated] = await db.$transaction([
        db.epaObservation.update({
          where: { id: observation.id },
          data: {
            status:       'SIGNED',
            signedAt:     new Date(),
            signedByName: signedByName ?? notification.recipientName,
          },
        }),
        db.attendingNotification.update({
          where: { id: notification.id },
          data: { respondedAt: new Date() },
        }),
      ]);

      return NextResponse.json(updated);
    }

    // action === 'return'
    const [updated] = await db.$transaction([
      db.epaObservation.update({
        where: { id: observation.id },
        data: {
          status:         'RETURNED',
          returnedReason: returnedReason ?? null,
        },
      }),
      db.attendingNotification.update({
        where: { id: notification.id },
        data: { respondedAt: new Date() },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[POST /api/epa/review/[token]]', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
