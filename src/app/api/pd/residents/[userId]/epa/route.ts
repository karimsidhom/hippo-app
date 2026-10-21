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
  const programId = req.nextUrl.searchParams.get('programId')?.trim();
  if (!programId) return reply({ error: 'Choose a program to view resident progress.' }, 400);

  const { userId: targetUserId } = await params;

  if (!(await getProgramResidentProgressAccess(user.id, programId, targetUserId))) return reply({ error: 'Resident progress is not available in this program.' }, 403);

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
