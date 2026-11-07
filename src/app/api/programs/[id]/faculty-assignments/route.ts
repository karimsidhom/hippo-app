import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';

// ---------------------------------------------------------------------------
// /api/programs/[id]/faculty-assignments
//
// Manage which faculty supervise which residents inside a program.
// Only program owners (OWNER / PD) can read or write — exposing the
// roster to other faculty would defeat the privacy gate this table
// implements.
//
//   GET    — list every assignment in the program (PD-only).
//   POST   — create one assignment (PD-only). Body:
//              { facultyId: ProgramMember.id,
//                residentId: ProgramMember.id,
//                startDate?, endDate?, isPrimary?, notes? }
//   DELETE — remove an assignment by id (PD-only).
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

interface ParamsCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id: programId } = await ctx.params;

  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json(
      { error: 'Only program owners can view faculty assignments.' },
      { status: 403 },
    );
  }

  const assignments = await db.facultyAssignment.findMany({
    where: { programId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    include: {
      faculty: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      resident: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json({ assignments });
}

interface CreateBody {
  facultyId?: string;
  residentId?: string;
  startDate?: string;
  endDate?: string;
  isPrimary?: boolean;
  notes?: string;
}

export async function POST(req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id: programId } = await ctx.params;
  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json(
      { error: 'Only program owners can create faculty assignments.' },
      { status: 403 },
    );
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.facultyId || !body.residentId) {
    return NextResponse.json(
      { error: 'facultyId and residentId are required' },
      { status: 400 },
    );
  }

  // Both members must belong to THIS program — otherwise the assignment
  // would create cross-program leakage.
  const [faculty, resident] = await Promise.all([
    db.programMember.findUnique({ where: { id: body.facultyId } }),
    db.programMember.findUnique({ where: { id: body.residentId } }),
  ]);
  if (!faculty || faculty.programId !== programId) {
    return NextResponse.json({ error: 'Faculty member not in this program' }, { status: 400 });
  }
  if (!resident || resident.programId !== programId) {
    return NextResponse.json({ error: 'Resident not in this program' }, { status: 400 });
  }
  if (faculty.id === resident.id) {
    return NextResponse.json(
      { error: 'A member cannot supervise themselves' },
      { status: 400 },
    );
  }

  const start = body.startDate ? new Date(body.startDate) : null;
  const end = body.endDate ? new Date(body.endDate) : null;
  if (start && end && start > end) {
    return NextResponse.json(
      { error: 'startDate must be on or before endDate' },
      { status: 400 },
    );
  }

  try {
    const created = await db.facultyAssignment.create({
      data: {
        programId,
        facultyId: faculty.id,
        residentId: resident.id,
        startDate: start,
        endDate: end,
        isPrimary: body.isPrimary ?? false,
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json({ assignment: created });
  } catch (err) {
    // The unique [facultyId, residentId, startDate] index can throw
    // when an existing identical assignment already exists.
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Could not create faculty assignment',
      },
      { status: 409 },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id: programId } = await ctx.params;
  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json(
      { error: 'Only program owners can remove faculty assignments.' },
      { status: 403 },
    );
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const existing = await db.facultyAssignment.findUnique({ where: { id } });
  if (!existing || existing.programId !== programId) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  await db.facultyAssignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
