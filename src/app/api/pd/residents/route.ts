import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getDirectedResidents } from '@/lib/program-auth';

/**
 * GET /api/pd/residents
 * Returns the resident/fellow roster the caller is allowed to see.
 *
 * Two-tier visibility (Stage-2 faculty-permissions sprint):
 *   • PD / OWNER / CHAIR / CC_MEMBER / DEPT_HEAD / COORDINATOR — see
 *     every member of the program(s) they hold that role on.
 *   • FACULTY (and legacy MEMBER) — see ONLY the residents they have
 *     an active FacultyAssignment to. The faculty member can still
 *     hit the dashboard; it just shows their direct trainees.
 *
 * The Profile.roleType gate (PROGRAM_DIRECTOR / ATTENDING / STAFF)
 * remains as the entry-level gate so non-staff users still get a 403.
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

  // Membership of a Program, never the self-declared institution string,
  // decides whose data a staff member may read. `institution` is free text
  // the caller sets on their own profile, so scoping on it let any account
  // claim PROGRAM_DIRECTOR at a real institution and read its whole roster.
  // getDirectedResidents returns an empty set for a caller who belongs to
  // no program — there is deliberately no institution-wide fallback.
  const scope = await getDirectedResidents(user.id);

  const profiles = scope.residentUserIds.length
    ? await db.profile.findMany({
        where: {
          userId: { in: scope.residentUserIds },
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
      })
    : [];

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
