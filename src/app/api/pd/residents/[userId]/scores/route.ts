import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings } from '@/lib/pd-meeting/access';

/**
 * Exam and in-service score rows. These hang off the resident rather than a
 * meeting, so a sitting is entered once and every later meeting shows the
 * whole history, exactly as the paper letter's Mini-QUEST table accumulates.
 */

/** POST body: { programId, tableId, sittingAt, values, note? } */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { userId: residentId } = await params;

  let body: {
    programId?: string;
    tableId?: string;
    sittingAt?: string;
    values?: unknown;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { programId, tableId, sittingAt } = body;
  if (!programId || !tableId || !sittingAt) {
    return NextResponse.json(
      { error: 'programId, tableId and sittingAt are required.' },
      { status: 400 },
    );
  }
  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const date = new Date(sittingAt);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'sittingAt is not a date.' }, { status: 400 });
  }

  // Values are stored as strings so "Away" and "Post call" round-trip
  // alongside "60.8", which is how the paper letter records them.
  const values: Record<string, string> = {};
  if (body.values && typeof body.values === 'object' && !Array.isArray(body.values)) {
    for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
      values[k] = v == null ? '' : String(v).slice(0, 60);
    }
  }

  const entry = await db.residentScoreEntry.create({
    data: {
      programId,
      residentId,
      tableId,
      sittingAt: date,
      values: values as object,
      note: body.note?.trim()?.slice(0, 500) || null,
    },
    select: { id: true, tableId: true, sittingAt: true, values: true, note: true },
  });

  return NextResponse.json(
    { entry: { ...entry, sittingAt: entry.sittingAt.toISOString() } },
    { status: 201 },
  );
}

/** DELETE /api/pd/residents/[userId]/scores?id=... */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { userId: residentId } = await params;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const entry = await db.residentScoreEntry.findUnique({
    where: { id },
    select: { id: true, programId: true, residentId: true },
  });
  // Mismatched resident is treated as missing, not as a different error.
  if (!entry || entry.residentId !== residentId) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (!(await canDirectMeetings(user.id, entry.programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await db.residentScoreEntry.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
