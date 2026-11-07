import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/programs/pending-invites
 *
 * Returns all pending (not accepted, not revoked, not expired) program invites
 * whose `email` matches the authenticated user's email. This powers the
 * in-app invite banner on the dashboard — the invitee does not need to click
 * a link in an email to see and accept invitations.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const authedUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!authedUser?.email) {
    return NextResponse.json({ invites: [] });
  }

  const invites = await db.programInvite.findMany({
    where: {
      email: authedUser.email.toLowerCase(),
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      program: {
        select: {
          id: true,
          name: true,
          institution: true,
          specialty: true,
        },
      },
      invitedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    invites: invites.map((i) => ({
      id: i.id,
      token: i.token,
      programId: i.programId,
      programName: i.program.name,
      programInstitution: i.program.institution,
      programSpecialty: i.program.specialty,
      inviterName: i.invitedBy?.name ?? null,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    })),
  });
}
