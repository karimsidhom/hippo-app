import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import {
  getOrCreateMeetingConfig,
  loadMeetingForDirector,
} from '@/lib/pd-meeting/access';
import { buildMeetingView } from '@/lib/pd-meeting/carry-forward';
import { asSections } from '@/lib/pd-meeting/types';

/**
 * GET /api/pd/meetings/[meetingId]
 *
 * Everything the editor needs in one call: the eight rows with the previous
 * meeting beside this one, the programme config, and the resident's
 * longitudinal scores and checklist state.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { meetingId } = await params;

  const meeting = await loadMeetingForDirector(meetingId, user.id);
  if (!meeting) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const config = await getOrCreateMeetingConfig(meeting.programId);

  const [scoreRows, checklistRows] = await Promise.all([
    db.residentScoreEntry.findMany({
      where: { programId: meeting.programId, residentId: meeting.residentId },
      orderBy: { sittingAt: 'asc' },
      select: { id: true, tableId: true, sittingAt: true, values: true, note: true },
    }),
    db.residentChecklistItem.findMany({
      where: { programId: meeting.programId, residentId: meeting.residentId },
      select: { itemId: true, completed: true, completedAt: true, note: true },
    }),
  ]);

  const scores: Record<string, unknown[]> = {};
  for (const r of scoreRows) {
    (scores[r.tableId] ??= []).push({
      id: r.id,
      sittingAt: r.sittingAt.toISOString(),
      values: r.values,
      note: r.note,
    });
  }

  const checklist: Record<
    string,
    { completed: boolean; completedAt: string | null; note: string | null }
  > = {};
  for (const c of checklistRows) {
    checklist[c.itemId] = {
      completed: c.completed,
      completedAt: c.completedAt?.toISOString() ?? null,
      note: c.note,
    };
  }

  const view = buildMeetingView(
    asSections(meeting.sections),
    meeting.previousMeeting ? asSections(meeting.previousMeeting.sections) : null,
    (config.sectionConfig as Record<string, string> | null) ?? {},
  );

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      programId: meeting.programId,
      residentId: meeting.residentId,
      meetingDate: meeting.meetingDate.toISOString(),
      cycleLabel: meeting.cycleLabel,
      pgyAtMeeting: meeting.pgyAtMeeting,
      status: meeting.status,
      publishedAt: meeting.publishedAt?.toISOString() ?? null,
      acknowledgedAt: meeting.acknowledgedAt?.toISOString() ?? null,
      previousMeetingDate: meeting.previousMeeting?.meetingDate.toISOString() ?? null,
      resident: meeting.resident,
    },
    view,
    config,
    scores,
    checklist,
  });
}

/**
 * PATCH /api/pd/meetings/[meetingId]
 *
 * Autosave. A published record may still be corrected, but doing so clears
 * the resident's acknowledgment, because they acknowledged different words.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { meetingId } = await params;

  const meeting = await loadMeetingForDirector(meetingId, user.id);
  if (!meeting) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  let body: {
    sections?: unknown;
    meetingDate?: unknown;
    cycleLabel?: unknown;
    status?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const wasPublished = meeting.status === 'PUBLISHED';
  const hadAck = meeting.acknowledgedAt !== null;

  // Reopening a published record. Publishing used to be one click with no
  // confirmation and no way back, so a mistyped letter stayed signed. Sending
  // it back to DRAFT clears the published stamp and any acknowledgment, and
  // the resident is told nothing until it is published again.
  const reopening = body.status === 'DRAFT' && wasPublished;

  const updated = await db.pdMeeting.update({
    where: { id: meeting.id },
    data: {
      ...(body.sections && typeof body.sections === 'object'
        ? { sections: body.sections as object }
        : {}),
      ...(typeof body.meetingDate === 'string'
        ? { meetingDate: new Date(body.meetingDate) }
        : {}),
      ...(typeof body.cycleLabel === 'string'
        ? { cycleLabel: body.cycleLabel.trim() || null }
        : {}),
      // Editing after publish invalidates the acknowledgment.
      ...(wasPublished ? { acknowledgedAt: null, acknowledgedName: null } : {}),
      ...(reopening ? { status: 'DRAFT' as const, publishedAt: null } : {}),
    },
    select: { id: true, updatedAt: true, status: true },
  });

  // A correction to a signed-off record is worth a trail.
  if (wasPublished) {
    await db.auditLog
      .create({
        data: {
          userId: user.id,
          action: reopening
            ? 'pd_meeting.reopened'
            : 'pd_meeting.edited_after_publish',
          entityType: 'PdMeeting',
          entityId: meeting.id,
          metadata: { clearedAcknowledgment: hadAck } as object,
        },
      })
      .catch(() => null);
  }

  return NextResponse.json({
    meeting: { ...updated, updatedAt: updated.updatedAt.toISOString() },
    acknowledgmentCleared: wasPublished && hadAck,
  });
}
