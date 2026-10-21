import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getMembership, roleCanManageProgram } from '@/lib/program-auth';
import { normalizeProgressSpecialty } from '@/lib/epa/progress-summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization',
  } });
}

function specialtyWhere(value: string) {
  const name = value.trim();
  return { OR: [
    { slug: { equals: normalizeProgressSpecialty(name), mode: 'insensitive' as const } },
    { name: { equals: name, mode: 'insensitive' as const } },
  ] };
}

function targetJson(row: { id: string; procedureDefinitionId: string; target: number; version: number; effectiveAt: Date; agreedAt: Date }, procedureName: string) {
  return { id: row.id, procedureDefinitionId: row.procedureDefinitionId, procedureName,
    target: row.target, version: row.version, effectiveAt: row.effectiveAt.toISOString(), agreedAt: row.agreedAt.toISOString() };
}

/** Programme minima are readable by members; they reveal no resident data. */
export async function GET(_req: Request, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  const { id: programId } = await ctx.params;
  try {
    const member = await getMembership(user.id, programId);
    if (!member) return reply({ error: 'Not a member of this program.' }, 403);
    const program = await db.program.findUnique({ where: { id: programId }, select: { specialty: true } });
    if (!program) return reply({ error: 'Program not found.' }, 404);
    const [versions, options] = await Promise.all([
      db.programProcedureTarget.findMany({ where: { programId }, orderBy: [{ procedureDefinitionId: 'asc' }, { version: 'desc' }] }),
      program.specialty ? db.procedureDefinition.findMany({
        where: { isActive: true, specialty: specialtyWhere(program.specialty) },
        select: { id: true, name: true, category: true }, orderBy: { name: 'asc' },
      }) : Promise.resolve([]),
    ]);
    const latest = versions.filter((row, index) => versions.findIndex(other => other.procedureDefinitionId === row.procedureDefinitionId) === index);
    const procedures = latest.length ? await db.procedureDefinition.findMany({
      where: { id: { in: latest.map(row => row.procedureDefinitionId) } }, select: { id: true, name: true },
    }) : [];
    const names = new Map(procedures.map(procedure => [procedure.id, procedure.name]));
    return reply({ targets: latest.map(row => targetJson(row, names.get(row.procedureDefinitionId) ?? 'Unavailable procedure')),
      options, canManage: roleCanManageProgram(member.role) });
  } catch {
    return reply({ error: 'Program targets are temporarily unavailable. Please try again.' }, 503);
  }
}

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
const targetInput = z.object({
  procedureDefinitionId: z.string().trim().min(1).max(128),
  target: z.number().int().min(1).max(100000),
  effectiveAt: z.union([calendarDate, z.string().max(50).datetime({ offset: true })]),
  agreed: z.literal(true),
}).strict();

/** Explicit agreement appends a new version; no historical target is edited. */
export async function PUT(req: Request, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  const { id: programId } = await ctx.params;
  try {
    const member = await getMembership(user.id, programId);
    if (!member || !roleCanManageProgram(member.role)) return reply({ error: 'Only program owners and directors can agree procedure targets.' }, 403);
    const parsed = targetInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Choose a procedure, a positive whole-number target, a valid effective date, and explicitly agree the target.' }, 400);
    const program = await db.program.findUnique({ where: { id: programId }, select: { specialty: true } });
    if (!program?.specialty) return reply({ error: 'Set the program specialty before agreeing procedure targets.' }, 409);
    const input = parsed.data;
    const procedure = await db.procedureDefinition.findFirst({
      where: { id: input.procedureDefinitionId, isActive: true, specialty: specialtyWhere(program.specialty) },
      select: { id: true, name: true },
    });
    if (!procedure) return reply({ error: 'Choose an active procedure from this program’s specialty.' }, 400);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await db.$transaction(async tx => {
          const previous = await tx.programProcedureTarget.findFirst({
            where: { programId, procedureDefinitionId: procedure.id }, orderBy: { version: 'desc' }, select: { version: true },
          });
          return tx.programProcedureTarget.create({ data: {
            programId, procedureDefinitionId: procedure.id, target: input.target, version: (previous?.version ?? 0) + 1,
            effectiveAt: new Date(input.effectiveAt), agreedAt: new Date(), agreedById: user.id,
          } });
        }, { isolationLevel: 'Serializable' });
        return reply({ target: targetJson(row, procedure.name), canManage: true }, 201);
      } catch (failure) {
        const code = failure && typeof failure === 'object' && 'code' in failure ? failure.code : null;
        if (attempt === 2 || (code !== 'P2002' && code !== 'P2034')) throw failure;
      }
    }
    return reply({ error: 'The target changed while saving. Please try again.' }, 409);
  } catch {
    return reply({ error: 'The agreed target could not be saved. Please try again.' }, 503);
  }
}
