import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/epa/observations/[id]/review-link
 * Owner-only. Returns the most recent AttendingNotification for this
 * observation so the resident can copy/share the review link themselves —
 * the primary use case being "the email never arrived, let me send the
 * link another way."
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;

    const observation = await db.epaObservation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
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

    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://hippomedicine.com';
    const reviewUrl = `${appBase}/review/${notification.accessToken}`;

    return NextResponse.json({
      reviewUrl,
      recipientEmail: notification.recipientEmail,
      recipientName: notification.recipientName,
      sentAt: notification.sentAt,
      viewedAt: notification.viewedAt,
      respondedAt: notification.respondedAt,
      expiresAt: notification.expiresAt,
      // Not part of the required response shape, but cheap to include and
      // lets the card decide whether "Send reminder" even makes sense
      // (never for channel === "in_app").
      channel: notification.channel,
    });
  } catch (err) {
    console.error('[GET /api/epa/observations/[id]/review-link]', err);
    return NextResponse.json({ error: 'Failed to load review link' }, { status: 500 });
  }
}
