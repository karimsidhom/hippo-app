import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings } from '@/lib/pd-meeting/access';
import { emptySections } from '@/lib/pd-meeting/types';

/**
 * POST /api/pd/meetings
 *
 * Start a meeting. previousMeetingId is resolved once here and then frozen,
 * so correcting an old record later never re-points this one's left column.
 */
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: {
    programId?: string;
    residentId?: string;
    meetingDate?: string;
    cycleLabel?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { residentId } = body;
  if (!residentId) {
    return NextResponse.json({ error: 'residentId is required.' }, { status: 400 });
  }

  // Resolve the programme server-side. The caller knows a resident, not
  // which of the caller's programmes that resident sits in, and the PD
  // dashboard is institution-scoped so it never has a programId to hand.
  let programId = body.programId;
  if (!programId) {
    const mine = await db.programMember.findMany({
      where: { userId: user.id, role: { in: ['OWNER', 'PD'] } },
      select: { programId: true },
    });
    const shared = await db.programMember.findMany({
      where: { userId: residentId, programId: { in: mine.map((m) => m.programId) } },
      select: { programId: true },
    });
    if (shared.length === 0) {
      return NextResponse.json(
        { error: 'That resident is not in a program you direct.' },
        { status: 400 },
      );
    }
    if (shared.length > 1) {
      // Genuinely ambiguous. Make the caller say which, rather than guess.
      return NextResponse.json(
        {
          error:
            'They are in more than one of your programs, so there is no single '
            + 'program to file this meeting under. Remove them from the one that no '
            + 'longer applies, under Programs.',
        },
        { status: 400 },
      );
    }
    programId = shared[0].programId;
  }

  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const member = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: residentId } },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json(
      { error: 'That resident is not in this program.' },
      { status: 400 },
    );
  }

  // An unfinished draft is reopened rather than duplicated. Two half-filled
  // records for one meeting is the worst outcome here.
  const openDraft = await db.pdMeeting.findFirst({
    where: { programId, residentId, status: 'DRAFT' },
    select: { id: true },
  });
  if (openDraft) {
    return NextResponse.json({ meeting: openDraft, reopened: true });
  }

  const previous = await db.pdMeeting.findFirst({
    where: { programId, residentId, status: 'PUBLISHED' },
    orderBy: { meetingDate: 'desc' },
    select: { id: true },
  });
  const profile = await db.profile.findUnique({
    where: { userId: residentId },
    select: { pgyYear: true },
  });

  const meeting = await db.pdMeeting.create({
    data: {
      programId,
      residentId,
      directorId: user.id,
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(),
      cycleLabel: body.cycleLabel?.trim() || null,
      pgyAtMeeting: profile?.pgyYear ?? null,
      previousMeetingId: previous?.id ?? null,
      sections: emptySections() as object,
    },
    select: { id: true },
  });

  return NextResponse.json({ meeting, reopened: false }, { status: 201 });
}

/** GET /api/pd/meetings?residentId=... */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const residentId = new URL(req.url).searchParams.get('residentId');
  if (!residentId) {
    return NextResponse.json({ error: 'residentId is required.' }, { status: 400 });
  }

  const memberships = await db.programMember.findMany({
    where: { userId: user.id, role: { in: ['OWNER', 'PD'] } },
    select: { programId: true },
  });
  const managed = memberships.map((m) => m.programId);
  if (managed.length === 0) return NextResponse.json({ meetings: [] });

  const meetings = await db.pdMeeting.findMany({
    where: { residentId, programId: { in: managed } },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true,
      meetingDate: true,
      cycleLabel: true,
      status: true,
      publishedAt: true,
      pgyAtMeeting: true,
      acknowledgedAt: true,
    },
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      ...m,
      meetingDate: m.meetingDate.toISOString(),
      publishedAt: m.publishedAt?.toISOString() ?? null,
      acknowledgedAt: m.acknowledgedAt?.toISOString() ?? null,
    })),
  });
}
