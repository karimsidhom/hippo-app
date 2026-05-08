import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import type { ProgramMemberRole } from '@prisma/client';

const ALLOWED_ROLES: ProgramMemberRole[] = [
  'OWNER',
  'PD',
  'CHAIR',
  'CC_MEMBER',
  'FACULTY',
  'COORDINATOR',
  'DEPT_HEAD',
  'MEMBER',
];

/**
 * PATCH /api/programs/[id]/members/[memberId]
 * Change a member's role. Owners only.
 *   body: { role: ProgramMemberRole }
 *
 * Demoting the last owner is blocked — same guard as DELETE so a
 * program never ends up with zero owners.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id, memberId } = await params;

  if (!(await isProgramOwner(user.id, id))) {
    return NextResponse.json(
      { error: 'Only program owners can change roles.' },
      { status: 403 },
    );
  }

  let body: { role?: ProgramMemberRole };
  try {
    body = (await req.json()) as { role?: ProgramMemberRole };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
    return NextResponse.json(
      { error: 'Missing or invalid role' },
      { status: 400 },
    );
  }

  const target = await db.programMember.findUnique({ where: { id: memberId } });
  if (!target || target.programId !== id) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Demoting the last OWNER (or PD-equivalent) leaves the program
  // un-owned. Block unless another OWNER/PD remains.
  if (
    (target.role === 'OWNER' || target.role === 'PD') &&
    body.role !== 'OWNER' &&
    body.role !== 'PD'
  ) {
    const ownerCount = await db.programMember.count({
      where: { programId: id, role: { in: ['OWNER', 'PD'] } },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        {
          error:
            'Cannot demote the last program owner. Promote another member first.',
        },
        { status: 400 },
      );
    }
  }

  const updated = await db.programMember.update({
    where: { id: memberId },
    data: { role: body.role },
  });
  return NextResponse.json({ member: updated });
}

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
