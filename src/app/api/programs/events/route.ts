import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { expandRecurrence } from '@/lib/recurrence';

/**
 * GET /api/programs/events?from=ISO&to=ISO&programId=ID
 *
 * List events across all the user's programs (or one program if `programId` is
 * given) within the window. Recurring events are expanded into individual
 * instances.
 *
 * Window defaults to [now - 7d, now + 30d] if not provided.
 */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');
  const programIdFilter = url.searchParams.get('programId');

  const now = new Date();
  const from = fromStr
    ? new Date(fromStr)
    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = toStr
    ? new Date(toStr)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    return NextResponse.json(
      { error: 'Invalid date range.' },
      { status: 400 },
    );
  }

  // Cap window to 366 days to prevent abuse
  const MAX_WINDOW_MS = 366 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
    return NextResponse.json(
      { error: 'Window too large (max 1 year).' },
      { status: 400 },
    );
  }

  // Programs the user is a member of
  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });
  const memberProgramIds = memberships.map((m) => m.programId);

  if (programIdFilter && !memberProgramIds.includes(programIdFilter)) {
    return NextResponse.json(
      { error: 'Not a member of that program.' },
      { status: 403 },
    );
  }

  const programIds = programIdFilter ? [programIdFilter] : memberProgramIds;
  if (programIds.length === 0) {
    return NextResponse.json({ events: [], programs: [] });
  }

  // Fetch all events in any matching program where:
  //   (non-recurring AND startAt <= to AND (endAt ?? startAt) >= from)
  //   OR (recurring AND startAt <= to AND (recurrenceUntil is null OR recurrenceUntil >= from))
  const candidates = await db.programEvent.findMany({
    where: {
      programId: { in: programIds },
      OR: [
        {
          recurrence: 'NONE',
          startAt: { lte: to },
        },
        {
          recurrence: { not: 'NONE' },
          startAt: { lte: to },
        },
      ],
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      program: { select: { id: true, name: true } },
    },
  });

  const expanded: Array<{
    id: string;
    programId: string;
    programName: string;
    title: string;
    description: string | null;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    location: string | null;
    url: string | null;
    type: string;
    recurrence: string;
    recurrenceUntil: string | null;
    createdById: string;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
    isRecurringInstance: boolean;
    originalStartAt: string;
  }> = [];

  for (const e of candidates) {
    const instances = expandRecurrence(
      {
        id: e.id,
        startAt: e.startAt,
        endAt: e.endAt,
        recurrence: e.recurrence,
        recurrenceUntil: e.recurrenceUntil,
      },
      from,
      to,
    );

    for (const inst of instances) {
      expanded.push({
        id: e.id,
        programId: e.programId,
        programName: e.program.name,
        title: e.title,
        description: e.description,
        startAt: inst.startAt.toISOString(),
        endAt: inst.endAt?.toISOString() ?? null,
        allDay: e.allDay,
        location: e.location,
        url: e.url,
        type: e.type,
        recurrence: e.recurrence,
        recurrenceUntil: e.recurrenceUntil?.toISOString() ?? null,
        createdById: e.createdById,
        createdByName: e.createdBy?.name ?? null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        isRecurringInstance: inst.isRecurringInstance,
        originalStartAt: inst.originalStartAt.toISOString(),
      });
    }
  }

  // Sort by startAt ascending
  expanded.sort((a, b) => a.startAt.localeCompare(b.startAt));

  // Also return lightweight program summaries for the UI
  const programs = await db.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true, name: true, institution: true, specialty: true },
  });

  return NextResponse.json({ events: expanded, programs });
}

/**
 * POST /api/programs/events
 * Create a new event. Must be a member of the program.
 */
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: {
    programId?: string;
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    allDay?: boolean;
    location?: string;
    url?: string;
    type?: string;
    recurrence?: string;
    recurrenceUntil?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.programId) {
    return NextResponse.json({ error: 'programId required' }, { status: 400 });
  }
  const title = body.title?.trim();
  if (!title || title.length < 1) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'title too long' }, { status: 400 });
  }
  if (!body.startAt) {
    return NextResponse.json({ error: 'startAt required' }, { status: 400 });
  }

  const membership = await db.programMember.findUnique({
    where: { programId_userId: { programId: body.programId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: 'Not a member of this program.' },
      { status: 403 },
    );
  }

  const startAt = new Date(body.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: 'Invalid startAt' }, { status: 400 });
  }
  const endAt = body.endAt ? new Date(body.endAt) : null;
  if (endAt && (Number.isNaN(endAt.getTime()) || endAt < startAt)) {
    return NextResponse.json({ error: 'Invalid endAt' }, { status: 400 });
  }

  const validTypes = ['GENERAL', 'VACATION', 'MEETING', 'CONFERENCE', 'ROUNDS', 'SOCIAL', 'DOCUMENT'];
  const type = validTypes.includes(body.type ?? '') ? body.type! : 'GENERAL';

  const validFreq = ['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
  const recurrence = validFreq.includes(body.recurrence ?? '')
    ? body.recurrence!
    : 'NONE';
  const recurrenceUntil =
    body.recurrenceUntil && recurrence !== 'NONE'
      ? new Date(body.recurrenceUntil)
      : null;
  if (recurrenceUntil && Number.isNaN(recurrenceUntil.getTime())) {
    return NextResponse.json(
      { error: 'Invalid recurrenceUntil' },
      { status: 400 },
    );
  }

  const created = await db.programEvent.create({
    data: {
      programId: body.programId,
      title,
      description: body.description?.trim() || null,
      startAt,
      endAt,
      allDay: body.allDay ?? false,
      location: body.location?.trim() || null,
      url: body.url?.trim() || null,
      type: type as 'GENERAL' | 'VACATION' | 'MEETING' | 'CONFERENCE' | 'ROUNDS' | 'SOCIAL' | 'DOCUMENT',
      recurrence: recurrence as 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
      recurrenceUntil,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { name: true } },
      program: { select: { name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    programId: created.programId,
    programName: created.program.name,
    title: created.title,
    description: created.description,
    startAt: created.startAt.toISOString(),
    endAt: created.endAt?.toISOString() ?? null,
    allDay: created.allDay,
    location: created.location,
    url: created.url,
    type: created.type,
    recurrence: created.recurrence,
    recurrenceUntil: created.recurrenceUntil?.toISOString() ?? null,
    createdById: created.createdById,
    createdByName: created.createdBy?.name ?? null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}
