import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { roleCanReadAllResidents } from '@/lib/program-auth';

/**
 * GET /api/pd/residents
 * Returns the resident/fellow roster the caller is allowed to see.
 *
 * Two-tier visibility (Stage-2 faculty-permissions sprint):
 *   • PD / OWNER / CHAIR / CC_MEMBER / DEPT_HEAD / COORDINATOR — see
 *     every resident at their institution who's also at least one
 *     of those roles' member of their program(s).
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

  if (!pdProfile.institution) {
    return NextResponse.json(
      { error: 'No institution set. Please update your profile with your institution.' },
      { status: 400 },
    );
  }

  // ── Compute FACULTY scope across every program the caller belongs to.
  // If the caller has ANY program where they have unbounded read access
  // (PD / CHAIR / etc.), they get the full institution roster. Otherwise
  // we filter to the union of residents directly assigned to them as
  // a FACULTY member.
  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { id: true, role: true, programId: true },
  });

  const hasUnbounded = memberships.some((m) =>
    roleCanReadAllResidents(m.role),
  );

  let allowedResidentUserIds: string[] | null = null;
  if (!hasUnbounded && memberships.length > 0) {
    // Build the union of residents assigned to me across all programs.
    const facultyMemberIds = memberships.map((m) => m.id);
    const now = new Date();
    const assignments = await db.facultyAssignment.findMany({
      where: {
        facultyId: { in: facultyMemberIds },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: {
        resident: { select: { userId: true } },
      },
    });
    allowedResidentUserIds = Array.from(
      new Set(assignments.map((a) => a.resident.userId)),
    );
  }
  // hasUnbounded === true OR memberships.length === 0 (legacy users)
  // both fall through to the institution-wide roster below.

  // Find all users at the same institution that pass the scope filter.
  const profiles = await db.profile.findMany({
    where: {
      institution: pdProfile.institution,
      userId: { not: user.id },
      roleType: { in: ['RESIDENT', 'FELLOW'] },
      ...(allowedResidentUserIds
        ? { userId: { in: allowedResidentUserIds } }
        : {}),
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
