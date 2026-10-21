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

/** Explicit programme membership replaces the old institution-wide fallback. */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  const programId = new URL(req.url).searchParams.get('programId')?.trim();
  if (!programId || programId.length > 128) return reply({ error: 'programId is required' }, 400);
  try {
    const scope = await getProgramProgressScope(user.id, programId);
    if (!scope) return reply({ error: 'You do not have access to this program’s resident progress.' }, 403);
    const profiles = await db.profile.findMany({
      where: { userId: { in: scope.residentUserIds }, roleType: { in: ['RESIDENT', 'FELLOW'] } },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    const historical = await loadProgramHistoricalProgress(programId, profiles.map(profile => profile.userId));
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
        historicalProgress: historical.get(`${userId}:${specialty}`) ?? null,
      };
    }));
    return reply({ programId: scope.program.id, programName: scope.program.name, institution: scope.program.institution, residents });
  } catch {
    return reply({ error: 'Resident progress is temporarily unavailable. Please try again.' }, 503);
  }
}
