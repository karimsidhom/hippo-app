import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { directsResident, STAFF_PROFILE_ROLES } from '@/lib/program-auth';

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

  // Staff only; which residents they see is decided by program membership.
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || !STAFF_PROFILE_ROLES.includes(pdProfile.roleType ?? '')) {
    return NextResponse.json(
      { error: 'Access denied. Staff role required.' },
      { status: 403 },
    );
  }

  const { userId: targetUserId } = await params;

  // Program membership, not the self-declared institution string, decides
  // whether the caller may read this resident's entrustment record.
  if (!(await directsResident(user.id, targetUserId))) {
    return NextResponse.json(
      { error: 'Resident not found in a program you direct.' },
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
