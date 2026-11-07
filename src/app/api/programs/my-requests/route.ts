import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/programs/my-requests
 *
 * The caller's own outstanding join requests and in-app invitations,
 * plus whether they belong to any program at all. Scoped to the caller
 * by construction, so there is no role check.
 *
 * hasProgram rides along so the dashboard can tell apart "waiting on
 * someone" from "not in a program and never asked", which need
 * different prompts.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [requests, membershipCount] = await Promise.all([
    db.programJoinRequest.findMany({
      where: { userId: user.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        invitedById: true,
        program: {
          select: { id: true, name: true, institution: true, specialty: true },
        },
      },
    }),
    db.programMember.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    hasProgram: membershipCount > 0,
    requests: requests.map((r) => ({
      id: r.id,
      programId: r.program.id,
      programName: r.program.name,
      programDetail:
        [r.program.institution, r.program.specialty].filter(Boolean).join(' · ') ||
        null,
      status: r.status,
      // True means a director invited them and they must answer.
      // False means they asked and are waiting on the director.
      invited: r.invitedById !== null,
    })),
  });
}
