import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings } from '@/lib/pd-meeting/access';

/**
 * PUT /api/pd/residents/[residentId]/checklist
 * Body: { programId, itemId, completed, note? }
 *
 * Curriculum and QI ticks persist on the resident, so a module ticked in
 * PGY-1 stays ticked and every later meeting shows it.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ residentId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { residentId } = await params;

  let body: { programId?: string; itemId?: string; completed?: unknown; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { programId, itemId } = body;
  if (!programId || !itemId) {
    return NextResponse.json(
      { error: 'programId and itemId are required.' },
      { status: 400 },
    );
  }
  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const completed = body.completed === true;
  const note = body.note?.trim()?.slice(0, 500) || null;

  const item = await db.residentChecklistItem.upsert({
    where: { residentId_programId_itemId: { residentId, programId, itemId } },
    create: {
      programId,
      residentId,
      itemId,
      completed,
      completedAt: completed ? new Date() : null,
      note,
    },
    update: {
      completed,
      // Clearing a tick clears its date too, rather than leaving a stale one.
      completedAt: completed ? new Date() : null,
      note,
    },
    select: { itemId: true, completed: true, completedAt: true, note: true },
  });

  return NextResponse.json({
    item: { ...item, completedAt: item.completedAt?.toISOString() ?? null },
  });
}
