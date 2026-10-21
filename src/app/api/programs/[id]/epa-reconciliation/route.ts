import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getProgramResidentProgressAccess, isProgramOwner } from '@/lib/program-auth';
import { progressContentHash } from '@/lib/epa/progress-hash';

const input = z.object({
  residentId: z.string().min(1), specialty: z.string().min(1).max(80),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  decision: z.enum(['approved', 'needs_review']),
  note: z.string().trim().max(2000).default(''),
}).strict();
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await ctx.params;
  const query = new URL(req.url).searchParams;
  const residentId = query.get('residentId');
  const specialty = query.get('specialty');
  if (!residentId || !specialty) return reply({ error: 'Resident and specialty required.' }, 400);
  if (!(await getProgramResidentProgressAccess(user.id, programId, residentId))) return reply({ error: 'Resident progress is outside your program access.' }, 403);
  const row = await db.epaProgressSnapshot.findUnique({ where: { userId_specialtySlug: { userId: residentId, specialtySlug: specialty } } });
  return reply({ snapshot: row?.payload ?? null, contentHash: row ? progressContentHash(row.payload) : null });
}

/** Review acknowledges a specific imported source; it never signs assessments. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await ctx.params;
  if (!(await isProgramOwner(user.id, programId))) return reply({ error: 'Program owner or PD role required.' }, 403);
  const body = input.safeParse(await req.json().catch(() => null));
  if (!body.success) return reply({ error: 'Provide the resident, specialty, source version and review decision.' }, 400);
  const { residentId, specialty, contentHash, decision, note } = body.data;
  if (!(await getProgramResidentProgressAccess(user.id, programId, residentId))) return reply({ error: 'Resident is outside this program.' }, 403);
  try {
    const result = await db.$transaction(async (tx) => {
      const row = await tx.epaProgressSnapshot.findUnique({ where: { userId_specialtySlug: { userId: residentId, specialtySlug: specialty } } });
      if (!row || progressContentHash(row.payload) !== contentHash) return null;
      await tx.epaProgressRevision.upsert({
        where: { userId_specialtySlug_contentHash: { userId: residentId, specialtySlug: specialty, contentHash } },
        create: { userId: residentId, specialtySlug: specialty, contentHash, sourceReviewDate: row.sourceReviewDate, payload: row.payload as Prisma.InputJsonValue }, update: {},
      });
      return tx.programEpaReconciliation.create({ data: { programId, residentId, specialtySlug: specialty, contentHash, decision, note, reviewedById: user.id } });
    }, { isolationLevel: 'Serializable' });
    if (!result) return reply({ error: 'This import changed. Refresh and review its latest version.' }, 409);
    return reply({ decision: result.decision, contentHash, reviewedAt: result.reviewedAt.toISOString() });
  } catch { return reply({ error: 'Review could not be saved. Refresh and try again.' }, 503); }
}
