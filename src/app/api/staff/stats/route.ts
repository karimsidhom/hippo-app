import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/staff/stats
 * Aggregates the staff dashboard: own case volume + teaching load.
 * Intended for STAFF / ATTENDING / PROGRAM_DIRECTOR role types.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    casesThisMonth,
    casesYtd,
    casesTotal,
    pendingSignOffs,
    signedThisMonth,
    signedYtd,
    topProceduresRaw,
    recentCases,
    recentSigned,
  ] = await Promise.all([
    db.caseLog.count({ where: { userId: user.id, caseDate: { gte: monthStart } } }),
    db.caseLog.count({ where: { userId: user.id, caseDate: { gte: yearStart } } }),
    db.caseLog.count({ where: { userId: user.id } }),
    db.epaObservation.count({
      where: { assessorUserId: user.id, status: { in: ['SUBMITTED', 'PENDING_REVIEW'] } },
    }),
    db.epaObservation.count({
      where: { assessorUserId: user.id, status: 'SIGNED', signedAt: { gte: monthStart } },
    }),
    db.epaObservation.count({
      where: { assessorUserId: user.id, status: 'SIGNED', signedAt: { gte: yearStart } },
    }),
    db.caseLog.groupBy({
      by: ['procedureName'],
      where: { userId: user.id },
      _count: { procedureName: true },
      orderBy: { _count: { procedureName: 'desc' } },
      take: 5,
    }),
    db.caseLog.findMany({
      where: { userId: user.id },
      orderBy: { caseDate: 'desc' },
      take: 5,
      select: { id: true, procedureName: true, caseDate: true, surgicalApproach: true, role: true },
    }),
    db.epaObservation.findMany({
      where: { assessorUserId: user.id, status: 'SIGNED' },
      orderBy: { signedAt: 'desc' },
      take: 5,
      select: {
        id: true, epaId: true, epaTitle: true, signedAt: true, entrustmentScore: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    casesThisMonth,
    casesYtd,
    casesTotal,
    pendingSignOffs,
    signedThisMonth,
    signedYtd,
    topProcedures: topProceduresRaw.map(p => ({ name: p.procedureName, count: p._count.procedureName })),
    recentCases,
    recentSigned: recentSigned.map(s => ({
      id: s.id,
      epaId: s.epaId,
      epaTitle: s.epaTitle,
      signedAt: s.signedAt,
      entrustmentScore: s.entrustmentScore,
      residentName: s.user?.name ?? null,
    })),
  });
}
