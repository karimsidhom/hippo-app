import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/pd/residents/:userId/epa
 * Returns full EPA observation list for the specified resident.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Verify PD role
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || pdProfile.roleType !== 'PROGRAM_DIRECTOR') {
    return NextResponse.json(
      { error: 'Access denied. Program Director role required.' },
      { status: 403 },
    );
  }

  const { userId: targetUserId } = await params;

  // Same gate as the summary route: membership of a programme the caller
  // directs grants access on its own, because the institution string is
  // free text and drops residents who typed it differently or left it blank.
  const targetProfile = await db.profile.findUnique({ where: { userId: targetUserId } });
  const sharesProgram = await db.programMember.count({
    where: {
      userId: targetUserId,
      program: {
        members: { some: { userId: user.id, role: { in: ['OWNER', 'PD'] } } },
      },
    },
  });
  const sameInstitution =
    !!pdProfile.institution &&
    !!targetProfile?.institution &&
    targetProfile.institution === pdProfile.institution;

  if (!targetProfile || (!sharesProgram && !sameInstitution)) {
    return NextResponse.json(
      { error: 'Resident not found in your program or institution.' },
      { status: 404 },
    );
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

  return NextResponse.json(observations);
}
