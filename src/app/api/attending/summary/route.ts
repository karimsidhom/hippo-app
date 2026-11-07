import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/attending/summary
 * Landing-strip counts for the attending inbox.
 * Role-gated to ATTENDING / STAFF / PROGRAM_DIRECTOR.
 *
 * Returns: { pendingReview, residentsToObserve, pearlsMentioning }
 *   - pendingReview       : EPA observations awaiting this user's sign-off
 *   - residentsToObserve  : residents at the attending's institution whose
 *                           average EPA completion is below 50% (proxy: fewer
 *                           than 5 signed observations total).
 *   - pearlsMentioning    : pearls whose content or linked CaseLog.attendingLabel
 *                           mentions this attending's name.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const me = await db.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      profile: { select: { roleType: true, institution: true } },
    },
  });

  const roleType = me?.profile?.roleType;
  if (
    roleType !== 'ATTENDING' &&
    roleType !== 'STAFF' &&
    roleType !== 'PROGRAM_DIRECTOR'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const institution = me?.profile?.institution ?? null;
  const myName = (me?.name ?? '').trim();

  // ── Pending review ────────────────────────────────────────────────────────
  const pendingReview = await db.epaObservation.count({
    where: {
      assessorUserId: user.id,
      status: { in: ['PENDING_REVIEW', 'DRAFT'] },
    },
  });

  // ── Residents to observe (proxy: < 5 signed observations) ─────────────────
  let residentsToObserve = 0;
  if (institution) {
    const residents = await db.user.findMany({
      where: {
        profile: {
          institution,
          roleType: { in: ['RESIDENT', 'FELLOW'] },
        },
      },
      select: {
        _count: {
          select: {
            epaObservations: { where: { status: 'SIGNED' } },
          },
        },
      },
    });
    residentsToObserve = residents.filter((r) => r._count.epaObservations < 5).length;
  }

  // ── Pearls mentioning this attending ──────────────────────────────────────
  let pearlsMentioning = 0;
  if (myName.length >= 2) {
    pearlsMentioning = await db.pearl.count({
      where: {
        OR: [
          { content: { contains: myName, mode: 'insensitive' } },
          { title: { contains: myName, mode: 'insensitive' } },
        ],
      },
    });
  }

  return NextResponse.json({
    pendingReview,
    residentsToObserve,
    pearlsMentioning,
  });
}
