import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { parseFormSchema } from '@/lib/forms/types';
import type { FormCategory, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// /api/forms/templates/[id]
//   GET    — full template payload (any program member)
//   PATCH  — edit template (owner-only)
//   DELETE — soft-delete by toggling active=false (owner-only)
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

interface ParamsCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const template = await db.formTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const member = await db.programMember.findFirst({
    where: { programId: template.programId, userId: user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ template });
}

interface PatchBody {
  name?: string;
  description?: string;
  category?: FormCategory;
  schema?: unknown;
  active?: boolean;
}

export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const template = await db.formTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await isProgramOwner(user.id, template.programId))) {
    return NextResponse.json(
      { error: 'Only program owners can edit form templates.' },
      { status: 403 },
    );
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description.trim() || null;
  if (body.category !== undefined) data.category = body.category;
  if (body.active !== undefined) data.active = body.active;
  if (body.schema !== undefined) {
    try {
      const parsed = parseFormSchema(body.schema);
      data.schema = parsed as unknown as Prisma.InputJsonValue;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid form schema' },
        { status: 400 },
      );
    }
  }

  const updated = await db.formTemplate.update({ where: { id }, data });
  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const template = await db.formTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await isProgramOwner(user.id, template.programId))) {
    return NextResponse.json(
      { error: 'Only program owners can delete form templates.' },
      { status: 403 },
    );
  }

  // Soft-delete via active=false so historical submissions stay
  // resolvable. Hard-delete is intentionally not exposed to avoid
  // breaking previously-signed records.
  await db.formTemplate.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
