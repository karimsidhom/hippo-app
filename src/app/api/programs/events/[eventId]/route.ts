import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';

/**
 * PATCH /api/programs/events/[eventId]
 * Update an event. Allowed if the user is the event creator or a program owner.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { eventId } = await params;

  const evt = await db.programEvent.findUnique({ where: { id: eventId } });
  if (!evt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isCreator = evt.createdById === user.id;
  const isOwner = await isProgramOwner(user.id, evt.programId);
  if (!isCreator && !isOwner) {
    return NextResponse.json(
      { error: 'Only the creator or a program owner can edit this event.' },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') {
    const v = body.title.trim();
    if (v.length < 1) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }
    data.title = v;
  }
  if ('description' in body) {
    data.description =
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim()
        : null;
  }
  if ('location' in body) {
    data.location =
      typeof body.location === 'string' && body.location.trim()
        ? body.location.trim()
        : null;
  }
  if ('url' in body) {
    data.url =
      typeof body.url === 'string' && body.url.trim() ? body.url.trim() : null;
  }
  if (typeof body.startAt === 'string') {
    const d = new Date(body.startAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid startAt' }, { status: 400 });
    }
    data.startAt = d;
  }
  if ('endAt' in body) {
    if (body.endAt === null || body.endAt === '') {
      data.endAt = null;
    } else if (typeof body.endAt === 'string') {
      const d = new Date(body.endAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid endAt' }, { status: 400 });
      }
      data.endAt = d;
    }
  }
  if (typeof body.allDay === 'boolean') data.allDay = body.allDay;

  const validTypes = ['GENERAL', 'VACATION', 'MEETING', 'CONFERENCE', 'ROUNDS', 'SOCIAL', 'DOCUMENT'];
  if (typeof body.type === 'string' && validTypes.includes(body.type)) {
    data.type = body.type;
  }

  const validFreq = ['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
  if (typeof body.recurrence === 'string' && validFreq.includes(body.recurrence)) {
    data.recurrence = body.recurrence;
  }
  if ('recurrenceUntil' in body) {
    if (body.recurrenceUntil === null || body.recurrenceUntil === '') {
      data.recurrenceUntil = null;
    } else if (typeof body.recurrenceUntil === 'string') {
      const d = new Date(body.recurrenceUntil);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Invalid recurrenceUntil' },
          { status: 400 },
        );
      }
      data.recurrenceUntil = d;
    }
  }

  const updated = await db.programEvent.update({
    where: { id: eventId },
    data,
  });
  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/programs/events/[eventId]
 * Delete. Creator or program owner only.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { eventId } = await params;

  const evt = await db.programEvent.findUnique({ where: { id: eventId } });
  if (!evt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isCreator = evt.createdById === user.id;
  const isOwner = await isProgramOwner(user.id, evt.programId);
  if (!isCreator && !isOwner) {
    return NextResponse.json(
      { error: 'Only the creator or a program owner can delete this event.' },
      { status: 403 },
    );
  }

  await db.programEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
