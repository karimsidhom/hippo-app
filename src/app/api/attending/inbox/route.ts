import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/attending/inbox
 * Returns all EPAs pending review where this user is the assessor.
 * Grouped: pending (actionable), recent (last 30d signed/returned).
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [pending, recent] = await Promise.all([
    db.epaObservation.findMany({
      where: {
        assessorUserId: user.id,
        status: 'PENDING_REVIEW',
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        caseLog: {
          select: {
            id: true,
            procedureName: true,
            caseDate: true,
            surgicalApproach: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.epaObservation.findMany({
      where: {
        assessorUserId: user.id,
        status: { in: ['SIGNED', 'RETURNED'] },
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        caseLog: {
          select: {
            id: true,
            procedureName: true,
            caseDate: true,
            surgicalApproach: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    pending,
    pendingCount: pending.length,
    recent,
  });
}
