import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { parseFormSchema } from '@/lib/forms/types';
import type { FormCategory, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// /api/forms/templates
//   GET ?programId=…   — list templates a caller can see (any program member)
//   POST              — create a new template (program owners only)
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const programId = req.nextUrl.searchParams.get('programId');
  if (programId) {
    const member = await db.programMember.findFirst({
      where: { programId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this program' }, { status: 403 });
    }
    const templates = await db.formTemplate.findMany({
      where: { programId },
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json({ templates });
  }

  // Default: every template across every program the caller is in.
  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });
  const programIds = memberships.map((m) => m.programId);
  const templates = await db.formTemplate.findMany({
    where: programIds.length > 0 ? { programId: { in: programIds } } : { id: '__none__' },
    orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json({ templates });
}

interface CreateBody {
  programId?: string;
  name?: string;
  description?: string;
  category?: FormCategory;
  schema?: unknown;
  active?: boolean;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.programId || !body.name || !body.schema) {
    return NextResponse.json(
      { error: 'programId, name, and schema are required' },
      { status: 400 },
    );
  }
  if (!(await isProgramOwner(user.id, body.programId))) {
    return NextResponse.json(
      { error: 'Only program owners can create form templates.' },
      { status: 403 },
    );
  }

  let schema;
  try {
    schema = parseFormSchema(body.schema);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid form schema' },
      { status: 400 },
    );
  }

  const created = await db.formTemplate.create({
    data: {
      programId: body.programId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      category: body.category ?? 'CUSTOM',
      schema: schema as unknown as Prisma.InputJsonValue,
      active: body.active ?? true,
      createdById: user.id,
    },
  });

  return NextResponse.json({ template: created });
}
