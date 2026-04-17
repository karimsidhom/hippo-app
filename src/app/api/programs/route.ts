import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramDirector } from '@/lib/program-auth';

/**
 * GET /api/programs
 * Returns all programs the current user is a member of.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: 'asc' },
    include: {
      program: {
        include: {
          _count: { select: { members: true, events: true } },
        },
      },
    },
  });

  const programs = memberships.map((m) => ({
    id: m.program.id,
    name: m.program.name,
    institution: m.program.institution,
    specialty: m.program.specialty,
    description: m.program.description,
    createdById: m.program.createdById,
    createdAt: m.program.createdAt.toISOString(),
    updatedAt: m.program.updatedAt.toISOString(),
    myRole: m.role,
    memberCount: m.program._count.members,
    eventCount: m.program._count.events,
  }));

  return NextResponse.json({ programs });
}

/**
 * POST /api/programs
 * Create a new program. Only Program Directors may create programs.
 * Creator is automatically added as OWNER.
 */
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const isPD = await isProgramDirector(user.id);
  if (!isPD) {
    return NextResponse.json(
      { error: 'Only Program Directors can create programs.' },
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

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: 'Program name is required (min 2 chars).' },
      { status: 400 },
    );
  }
  if (name.length > 120) {
    return NextResponse.json(
      { error: 'Program name must be 120 chars or fewer.' },
      { status: 400 },
    );
  }

  // Default institution/specialty to the creator's profile if not provided
  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  const program = await db.program.create({
    data: {
      name,
      institution: body.institution?.trim() || profile?.institution || null,
      specialty: body.specialty?.trim() || profile?.specialty || null,
      description: body.description?.trim() || null,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  return NextResponse.json({
    id: program.id,
    name: program.name,
    institution: program.institution,
    specialty: program.specialty,
    description: program.description,
    createdById: program.createdById,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
    myRole: 'OWNER',
    memberCount: 1,
    eventCount: 0,
  });
}
