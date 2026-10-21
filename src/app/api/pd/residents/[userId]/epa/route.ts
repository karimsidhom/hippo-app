import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getProgramResidentProgressAccess } from '@/lib/program-auth';

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

/**
 * GET /api/pd/residents/:userId/epa
 * Returns full EPA observation list for the specified resident.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }

  // Verify PD role
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || pdProfile.roleType !== 'PROGRAM_DIRECTOR') {
    return reply({ error: 'Access denied. Program Director role required.' }, 403);
  }

  const programId = req.nextUrl.searchParams.get('programId')?.trim();
  if (!programId) return reply({ error: 'Choose a program to view resident progress.' }, 400);

  const { userId: targetUserId } = await params;

  // Program membership, not the self-declared institution string, decides
  // whether the caller may read this resident's entrustment record. The
  // program-scoped check is narrower than directsResident: one program, no
  // coordinators, faculty only through a current assignment.
  if (!(await getProgramResidentProgressAccess(user.id, programId, targetUserId))) {
    return reply({ error: 'Resident not found in a program you direct.' }, 404);
  }

  const observations = await db.epaObservation.findMany({
    where: { userId: targetUserId },
    orderBy: { observationDate: 'desc' },
    include: {
      caseLog: {
        select: {
          id: true,
          procedureName: true,
          caseDate: true,
          surgicalApproach: true,
          autonomyLevel: true,
          operativeDurationMinutes: true,
        },
      },
    },
  });

  return reply(observations);
}
