import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';

/**
 * DELETE /api/programs/[id]/invites/[inviteId]
 * Revoke a pending invite. Owner only.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id, inviteId } = await params;

  if (!(await isProgramOwner(user.id, id))) {
    return NextResponse.json(
      { error: 'Access denied. Owner only.' },
      { status: 403 },
    );
  }

  const invite = await db.programInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.programId !== id) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: 'Invite already accepted; cannot revoke.' },
      { status: 400 },
    );
  }

  await db.programInvite.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
