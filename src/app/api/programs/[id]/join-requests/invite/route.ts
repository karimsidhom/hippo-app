import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { canCreateJoinRequest } from '@/lib/program-join/state';
import { createNotification } from '@/lib/notifications/create';

/**
 * POST /api/programs/[id]/join-requests/invite
 *
 * The director invites someone who already has a Hippo account. Creates
 * a PENDING request with invitedById set, which flips the handshake:
 * the resident accepts rather than the director approving.
 *
 * ProgramInvite stays the path for people who have no account yet. It is
 * email-and-token based, so using it here would mail a link to someone
 * who is already signed in.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: { userId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }
  const targetId = typeof body.userId === 'string' ? body.userId : '';
  if (!targetId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json(
      { error: 'You cannot invite yourself.' },
      { status: 400 },
    );
  }

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const alreadyMember = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: targetId } },
    select: { id: true },
  });
  if (alreadyMember) {
    return NextResponse.json(
      { error: 'They are already a member of this program.' },
      { status: 409 },
    );
  }

  const existing = await db.programJoinRequest.findUnique({
    where: { programId_userId: { programId, userId: targetId } },
    select: { status: true, invitedById: true },
  });
  const decision = canCreateJoinRequest(existing);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const [request, program] = await Promise.all([
    db.programJoinRequest.upsert({
      where: { programId_userId: { programId, userId: targetId } },
      create: {
        programId,
        userId: targetId,
        invitedById: user.id,
        status: 'PENDING',
      },
      update: {
        status: 'PENDING',
        invitedById: user.id,
        decidedById: null,
        decidedAt: null,
        declineReason: null,
      },
      select: { id: true, status: true },
    }),
    db.program.findUnique({
      where: { id: programId },
      select: { name: true },
    }),
  ]);

  // Fire and forget. A notification failure must not undo the invite,
  // which the resident can still find on their dashboard.
  await createNotification({
    userId: targetId,
    type: 'program.invite',
    title: `Invitation to join ${program?.name ?? 'a program'}`,
    body: 'A program director has invited you to join their program on Hippo.',
    actionUrl: '/dashboard',
  }).catch(() => null);

  return NextResponse.json({ request }, { status: 201 });
}
