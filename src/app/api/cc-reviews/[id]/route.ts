import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { reviewAccess, canWriteReview } from './access';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' } });
}

export async function GET(_req: NextRequest, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  try {
    const { id } = await ctx.params;
    const access = await reviewAccess(id, user.id);
    if (access.error) return reply({ error: access.error === 'not_found' ? 'Review not found' : 'Forbidden' }, access.error === 'not_found' ? 404 : 403);
    const full = await db.cCReview.findUnique({ where: { id }, include: {
      resident: { select: { id: true, name: true, email: true, image: true } },
      finalisedBy: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } },
      notes: { include: { author: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: 'asc' } },
    } });
    return full ? reply({ review: full }) : reply({ error: 'Review not found' }, 404);
  } catch { return reply({ error: 'Review is temporarily unavailable.' }, 503); }
}

const patchInput = z.object({
  decision: z.enum(['PROMOTE', 'CONTINUE', 'ON_WATCH', 'REMEDIATION', 'PROBATION', 'GRADUATE', 'WITHDRAW']).optional(),
  decisionRationale: z.string().max(20000).optional(), chairSummary: z.string().max(20000).optional(),
  dissent: z.string().max(20000).optional(), cycleLabel: z.string().max(200).optional(),
  status: z.enum(['IN_PROGRESS', 'FINALISED', 'ARCHIVED']).optional(),
}).strict().refine(value => Object.keys(value).length > 0);

export async function PATCH(req: NextRequest, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  try {
    const { id } = await ctx.params;
    const access = await reviewAccess(id, user.id);
    if (access.error) return reply({ error: access.error === 'not_found' ? 'Review not found' : 'Forbidden' }, access.error === 'not_found' ? 404 : 403);
    if (!canWriteReview(access.role)) return reply({ error: 'Forbidden' }, 403);
    const parsed = patchInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Use valid review fields.' }, 400);
    const body = parsed.data;
    // Preserve the actual existing OWNER-only finalisation boundary. Also
    // prevent other members from reopening or archiving signed decisions.
    if (body.status !== undefined && access.role !== 'OWNER') return reply({ error: 'Only program owners can change review status.' }, 403);
    if (access.review.status !== 'IN_PROGRESS' && body.status !== 'IN_PROGRESS' && body.status !== 'ARCHIVED') {
      return reply({ error: 'This review is locked. An owner must reopen it before editing.' }, 409);
    }
    const data = {
      ...(body.decision !== undefined ? { decision: body.decision } : {}),
      ...(body.decisionRationale !== undefined ? { decisionRationale: body.decisionRationale.trim() || null } : {}),
      ...(body.chairSummary !== undefined ? { chairSummary: body.chairSummary.trim() || null } : {}),
      ...(body.dissent !== undefined ? { dissent: body.dissent.trim() || null } : {}),
      ...(body.cycleLabel !== undefined ? { cycleLabel: body.cycleLabel.trim() || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.status === 'FINALISED' ? { finalisedAt: new Date(), finalisedById: user.id } : {}),
      ...(body.status === 'IN_PROGRESS' ? { finalisedAt: null, finalisedById: null } : {}),
    };
    const updated = await db.cCReview.update({ where: { id }, data });
    return reply({ review: updated });
  } catch { return reply({ error: 'Review could not be saved. Please try again.' }, 503); }
}
