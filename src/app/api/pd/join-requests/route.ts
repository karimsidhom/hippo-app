import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { roleCanManageProgram } from '@/lib/program-auth';

/**
 * GET /api/pd/join-requests
 *
 * Every pending join request across every program the caller directs.
 *
 * The PD dashboard is institution-scoped, not program-scoped: it never
 * resolves a single programId (see /api/pd/residents). So this endpoint
 * spans the caller's programs and returns programId per row, which the
 * queue needs anyway to PATCH the right request.
 *
 * Only OWNER and PD can manage a roster, so only their programs count.
 * A caller who directs nothing gets an empty list rather than a 403:
 * the dashboard is shared with attendings and faculty, and an empty
 * queue simply renders nothing.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { programId: true, role: true },
  });
  const managed = memberships
    .filter((m) => roleCanManageProgram(m.role))
    .map((m) => m.programId);

  if (managed.length === 0) return NextResponse.json({ requests: [] });

  const requests = await db.programJoinRequest.findMany({
    where: { programId: { in: managed }, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      programId: true,
      claimedPgy: true,
      message: true,
      invitedById: true,
      createdAt: true,
      program: { select: { name: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: {
            select: {
              roleType: true,
              trainingYearLabel: true,
              institution: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      programId: r.programId,
      programName: r.program.name,
      claimedPgy: r.claimedPgy,
      message: r.message,
      // Null means the resident asked and the director must decide.
      // Set means the director already asked and is waiting on them.
      invitedById: r.invitedById,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
        roleType: r.user.profile?.roleType ?? null,
        trainingYearLabel: r.user.profile?.trainingYearLabel ?? null,
        institution: r.user.profile?.institution ?? null,
      },
    })),
  });
}
