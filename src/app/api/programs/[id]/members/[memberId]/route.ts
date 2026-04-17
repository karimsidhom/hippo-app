import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';

/**
 * DELETE /api/programs/[id]/members/[memberId]
 * Remove a member. Owners can remove anyone (except the last owner);
 * members can only remove themselves (leave the program).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id, memberId } = await params;

  const target = await db.programMember.findUnique({ where: { id: memberId } });
  if (!target || target.programId !== id) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const isOwner = await isProgramOwner(user.id, id);
  const isSelf = target.userId === user.id;

  if (!isOwner && !isSelf) {
    return NextResponse.json(
      { error: 'You can only remove yourself or be removed by an owner.' },
      { status: 403 },
    );
  }

  // Prevent removing the last owner
  if (target.role === 'OWNER') {
    const ownerCount = await db.programMember.count({
      where: { programId: id, role: 'OWNER' },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last owner. Transfer ownership or delete the program.' },
        { status: 400 },
      );
    }
  }

  await db.programMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
