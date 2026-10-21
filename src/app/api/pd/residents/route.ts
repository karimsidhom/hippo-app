import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getProgramProgressScope } from '@/lib/program-auth';
import { loadProgramHistoricalProgress } from '@/lib/epa/program-progress';
import { normalizeProgressSpecialty } from '@/lib/epa/progress-summary';

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization',
  } });
}

/**
 * GET /api/pd/residents?programId=
 * Returns the resident/fellow roster the caller is allowed to see in one
 * program.
 *
 * Two-tier visibility (Stage-2 faculty-permissions sprint):
 *   • PD / OWNER / CHAIR / CC_MEMBER / DEPT_HEAD — see every resident
 *     member of the selected program. COORDINATOR manages the roster
 *     elsewhere but never sees identifiable progress here.
 *   • FACULTY (and legacy MEMBER) — see ONLY the residents they have
 *     an active FacultyAssignment to in that program.
 *
 * Membership of a Program, never the self-declared institution string,
 * decides whose data a staff member may read. `institution` is free text
 * the caller sets on their own profile, so scoping on it let any account
 * claim PROGRAM_DIRECTOR at a real institution and read its whole roster.
 * There is deliberately no institution-wide fallback.
 *
 * The Profile.roleType gate (PROGRAM_DIRECTOR / ATTENDING / STAFF)
 * remains as the entry-level gate so non-staff users still get a 403.
 */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }

  const STAFF_ROLES = ['PROGRAM_DIRECTOR', 'ATTENDING', 'STAFF'];
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || !STAFF_ROLES.includes(pdProfile.roleType ?? '')) {
    return reply({ error: 'Access denied. Staff role required.' }, 403);
  }

  const programId = new URL(req.url).searchParams.get('programId')?.trim();
  if (!programId || programId.length > 128) return reply({ error: 'programId is required' }, 400);
  try {
    const scope = await getProgramProgressScope(user.id, programId);
    if (!scope) return reply({ error: 'You do not have access to this program’s resident progress.' }, 403);
    const profiles = await db.profile.findMany({
      where: { userId: { in: scope.residentUserIds.filter(id => id !== user.id) }, roleType: { in: ['RESIDENT', 'FELLOW'] } },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    const residentIds = profiles.map(profile => profile.userId);
    const [historical, lastMeetings] = await Promise.all([
      loadProgramHistoricalProgress(programId, residentIds),
      // The most recent 1:1 per resident. The cohort page had no meeting
      // column at all, so the only way to find out who was overdue was to
      // open every resident in turn.
      db.pdMeeting.findMany({
        where: { residentId: { in: residentIds } },
        orderBy: { meetingDate: 'desc' },
        select: { residentId: true, meetingDate: true, status: true },
      }),
    ]);
    const lastMeetingBy = new Map<string, { meetingDate: Date; status: string }>();
    for (const m of lastMeetings) {
      if (!lastMeetingBy.has(m.residentId)) {
        lastMeetingBy.set(m.residentId, { meetingDate: m.meetingDate, status: m.status });
      }
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const residents = await Promise.all(profiles.map(async profile => {
      const userId = profile.userId;
      const [totalCases, casesThisMonth, casesThisWeek, lastCase, epaTotal, epaSigned, epaPending] = await Promise.all([
        db.caseLog.count({ where: { userId } }),
        db.caseLog.count({ where: { userId, caseDate: { gte: startOfMonth } } }),
        db.caseLog.count({ where: { userId, caseDate: { gte: startOfWeek } } }),
        db.caseLog.findFirst({ where: { userId }, orderBy: { caseDate: 'desc' }, select: { caseDate: true } }),
        db.epaObservation.count({ where: { userId } }),
        db.epaObservation.count({ where: { userId, status: 'SIGNED' } }),
        db.epaObservation.count({ where: { userId, status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'] } } }),
      ]);
      const specialty = normalizeProgressSpecialty(profile.specialty ?? scope.program.specialty ?? '');
      return {
        userId, name: profile.user.name, email: profile.user.email, image: profile.user.image,
        roleType: profile.roleType, specialty: profile.specialty, pgyYear: profile.pgyYear,
        trainingYearLabel: profile.trainingYearLabel, totalCases, casesThisMonth, casesThisWeek,
        epaTotal, epaSigned, epaPending, lastCaseDate: lastCase?.caseDate ?? null,
        lastMeetingDate: lastMeetingBy.get(userId)?.meetingDate ?? null,
        lastMeetingStatus: lastMeetingBy.get(userId)?.status ?? null,
        historicalProgress: historical.get(`${userId}:${specialty}`) ?? null,
      };
    }));
    return reply({ programId: scope.program.id, programName: scope.program.name, institution: scope.program.institution, residents });
  } catch {
    return reply({ error: 'Resident progress is temporarily unavailable. Please try again.' }, 503);
  }
}
