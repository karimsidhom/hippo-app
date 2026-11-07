import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getMembership, isProgramOwner } from '@/lib/program-auth';

/**
 * GET /api/programs/[id]
 * Returns program detail, full member roster, and pending invites (if owner).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const membership = await getMembership(user.id, id);
  if (!membership) {
    return NextResponse.json(
      { error: 'Access denied. You are not a member of this program.' },
      { status: 403 },
    );
  }

  const [program, members, invites] = await Promise.all([
    db.program.findUnique({ where: { id } }),
    db.programMember.findMany({
      where: { programId: id },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: { select: { roleType: true, trainingYearLabel: true } },
          },
        },
      },
    }),
    membership.role === 'OWNER'
      ? db.programInvite.findMany({
          where: { programId: id, acceptedAt: null, revokedAt: null },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  return NextResponse.json({
    program: {
      id: program.id,
      name: program.name,
      institution: program.institution,
      specialty: program.specialty,
      description: program.description,
      createdById: program.createdById,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    },
    myRole: membership.role,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      roleType: m.user.profile?.roleType ?? null,
      trainingYearLabel: m.user.profile?.trainingYearLabel ?? null,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
      acceptedAt: i.acceptedAt?.toISOString() ?? null,
      revokedAt: i.revokedAt?.toISOString() ?? null,
    })),
  });
}

/**
 * PATCH /api/programs/[id]
 * Update program details. Owner only.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  if (!(await isProgramOwner(user.id, id))) {
    return NextResponse.json(
      { error: 'Access denied. Owner only.' },
      { status: 403 },
    );
  }

  let body: {
    name?: string;
    institution?: string;
    specialty?: string;
    description?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  if (body.name !== undefined) {
    const v = body.name.trim();
    if (v.length < 2) {
      return NextResponse.json({ error: 'Name too short' }, { status: 400 });
    }
    data.name = v;
  }
  if (body.institution !== undefined) data.institution = body.institution.trim() || null;
  if (body.specialty !== undefined) data.specialty = body.specialty.trim() || null;
  if (body.description !== undefined) data.description = body.description.trim() || null;

  const updated = await db.program.update({ where: { id }, data });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    institution: updated.institution,
    specialty: updated.specialty,
    description: updated.description,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/programs/[id]
 * Delete program. Owner only. Cascade deletes members, invites, events.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  if (!(await isProgramOwner(user.id, id))) {
    return NextResponse.json(
      { error: 'Access denied. Owner only.' },
      { status: 403 },
    );
  }

  await db.program.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
