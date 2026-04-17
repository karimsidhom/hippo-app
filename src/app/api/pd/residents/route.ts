import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/pd/residents
 * Returns all residents/fellows at the same institution as the
 * requesting staff member (PD, Attending, or Staff).
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const STAFF_ROLES = ['PROGRAM_DIRECTOR', 'ATTENDING', 'STAFF'];

  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || !STAFF_ROLES.includes(pdProfile.roleType ?? '')) {
    return NextResponse.json(
      { error: 'Access denied. Staff role required.' },
      { status: 403 },
    );
  }

  if (!pdProfile.institution) {
    return NextResponse.json(
      { error: 'No institution set. Please update your profile with your institution.' },
      { status: 400 },
    );
  }

  // Find all users at the same institution
  const profiles = await db.profile.findMany({
    where: {
      institution: pdProfile.institution,
      userId: { not: user.id },
      roleType: { in: ['RESIDENT', 'FELLOW'] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  // Date boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  // Build result for each resident
  const residents = await Promise.all(
    profiles.map(async (profile) => {
      const userId = profile.userId;

      // Case counts
      const [totalCases, casesThisMonth, casesThisWeek, lastCase] = await Promise.all([
        db.caseLog.count({ where: { userId } }),
        db.caseLog.count({ where: { userId, caseDate: { gte: startOfMonth } } }),
        db.caseLog.count({ where: { userId, caseDate: { gte: startOfWeek } } }),
        db.caseLog.findFirst({
          where: { userId },
          orderBy: { caseDate: 'desc' },
          select: { caseDate: true },
        }),
      ]);

      // EPA counts
      const [totalEpas, signedEpas, pendingEpas] = await Promise.all([
        db.epaObservation.count({ where: { userId } }),
        db.epaObservation.count({ where: { userId, status: 'SIGNED' } }),
        db.epaObservation.count({
          where: { userId, status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'] } },
        }),
      ]);

      return {
        userId,
        name: profile.user.name,
        email: profile.user.email,
        image: profile.user.image,
        roleType: profile.roleType,
        specialty: profile.specialty,
        pgyYear: profile.pgyYear,
        trainingYearLabel: profile.trainingYearLabel,
        totalCases,
        casesThisMonth,
        casesThisWeek,
        epaTotal: totalEpas,
        epaSigned: signedEpas,
        epaPending: pendingEpas,
        lastCaseDate: lastCase?.caseDate ?? null,
      };
    }),
  );

  return NextResponse.json({
    institution: pdProfile.institution,
    residents,
  });
}
