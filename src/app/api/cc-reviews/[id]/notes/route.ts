import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { reviewAccess, canWriteReview } from '../access';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' } });
}
const noteInput = z.object({ body: z.string().trim().min(1).max(20000), category: z.string().trim().max(200).optional() }).strict();

export async function POST(req: NextRequest, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  try {
    const { id } = await ctx.params;
    const access = await reviewAccess(id, user.id);
    if (access.error) return reply({ error: access.error === 'not_found' ? 'Review not found' : 'Forbidden' }, access.error === 'not_found' ? 404 : 403);
    if (!canWriteReview(access.role)) return reply({ error: 'Forbidden' }, 403);
    if (access.review.status !== 'IN_PROGRESS') return reply({ error: 'Notes are locked once the review is finalised.' }, 409);
    const parsed = noteInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Enter a valid note and optional category.' }, 400);
    const created = await db.cCReviewNote.create({ data: {
      reviewId: id, authorId: user.id, body: parsed.data.body, category: parsed.data.category || null,
    }, include: { author: { select: { id: true, name: true, image: true } } } });
    return reply({ note: created });
  } catch { return reply({ error: 'Note could not be saved. Please try again.' }, 503); }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set('Cache-Control', 'private, no-store'); return error; }
  try {
    const { id } = await ctx.params;
    const access = await reviewAccess(id, user.id);
    if (access.error) return reply({ error: access.error === 'not_found' ? 'Review not found' : 'Forbidden' }, access.error === 'not_found' ? 404 : 403);
    if (!canWriteReview(access.role)) return reply({ error: 'Forbidden' }, 403);
    if (access.review.status !== 'IN_PROGRESS') return reply({ error: 'Notes are locked once the review is finalised.' }, 409);
    const noteId = req.nextUrl.searchParams.get('noteId');
    if (!noteId) return reply({ error: 'noteId required' }, 400);
    const note = await db.cCReviewNote.findUnique({ where: { id: noteId }, select: { id: true, reviewId: true, authorId: true } });
    if (!note || note.reviewId !== id) return reply({ error: 'Note not found' }, 404);
    if (note.authorId !== user.id) return reply({ error: 'Only the original author can remove their note.' }, 403);
    await db.cCReviewNote.delete({ where: { id: noteId } });
    return reply({ ok: true });
  } catch { return reply({ error: 'Note could not be removed. Please try again.' }, 503); }
}
