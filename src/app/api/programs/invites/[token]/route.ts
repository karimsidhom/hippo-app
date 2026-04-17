import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/programs/invites/[token]
 * Public-ish: returns minimal info about an invite so the join page can
 * render a preview. Does NOT require auth — the token itself is the secret.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await db.programInvite.findUnique({
    where: { token },
    include: {
      program: { select: { id: true, name: true, institution: true, specialty: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.revokedAt) {
    return NextResponse.json({ error: 'Invite revoked' }, { status: 410 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: 'Invite already accepted', programId: invite.programId },
      { status: 410 },
    );
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  return NextResponse.json({
    email: invite.email,
    program: invite.program,
    inviterName: invite.invitedBy?.name ?? null,
    expiresAt: invite.expiresAt.toISOString(),
  });
}

/**
 * POST /api/programs/invites/[token]
 * Accept the invite. Requires the user to be authenticated (so we can create
 * a ProgramMember row for them).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { token } = await params;

  const invite = await db.programInvite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.revokedAt) {
    return NextResponse.json({ error: 'Invite revoked' }, { status: 410 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: 'Invite already accepted', programId: invite.programId },
      { status: 410 },
    );
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  // Optional soft-check: invite email should match the user's email. We log
  // but don't block — PDs may invite a personal email then the resident signs
  // up with their institutional one.
  const authedUser = await db.user.findUnique({ where: { id: user.id } });
  if (
    authedUser &&
    authedUser.email.toLowerCase() !== invite.email.toLowerCase()
  ) {
    console.log(
      `[program-invite] accept: invite email (${invite.email}) != authed (${authedUser.email}) — allowing anyway`,
    );
  }

  // Upsert membership — if somehow they're already a member, don't create a dup.
  const existing = await db.programMember.findUnique({
    where: { programId_userId: { programId: invite.programId, userId: user.id } },
  });

  if (!existing) {
    await db.programMember.create({
      data: {
        programId: invite.programId,
        userId: user.id,
        role: 'MEMBER',
      },
    });
  }

  await db.programInvite.update({
    where: { id: invite.id },
    data: {
      acceptedAt: new Date(),
      acceptedById: user.id,
    },
  });

  return NextResponse.json({ ok: true, programId: invite.programId });
}
