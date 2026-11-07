import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import {
  getOrCreateMeetingConfig,
  loadMeetingForDirector,
} from '@/lib/pd-meeting/access';
import { validateForPublish } from '@/lib/pd-meeting/carry-forward';
import { meetingMetrics } from '@/lib/pd-meeting/metrics';
import { asSections } from '@/lib/pd-meeting/types';
import { createNotification } from '@/lib/notifications/create';

/**
 * POST /api/pd/meetings/[meetingId]/publish
 *
 * Validates, freezes a snapshot, and marks the record published.
 *
 * The snapshot is what Phase 3 renders the PDF from. It captures the config,
 * the score rows, the checklist state, the previous column and the derived
 * metrics exactly as they stood, so reopening a 2024 record shows 2024's
 * numbers rather than today's.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { meetingId } = await params;

  const meeting = await loadMeetingForDirector(meetingId, user.id);
  if (!meeting) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const current = asSections(meeting.sections);
  const previous = meeting.previousMeeting
    ? asSections(meeting.previousMeeting.sections)
    : null;

  const problems = validateForPublish(current, previous);
  if (problems.length > 0) {
    // Nothing is written. The editor renders each problem against its
    // own section rather than as one generic error.
    return NextResponse.json({ problems }, { status: 409 });
  }

  const [config, scoreRows, checklistRows, metrics] = await Promise.all([
    getOrCreateMeetingConfig(meeting.programId),
    db.residentScoreEntry.findMany({
      where: { programId: meeting.programId, residentId: meeting.residentId },
      orderBy: { sittingAt: 'asc' },
      select: { tableId: true, sittingAt: true, values: true, note: true },
    }),
    db.residentChecklistItem.findMany({
      where: { programId: meeting.programId, residentId: meeting.residentId },
      select: { itemId: true, completed: true, completedAt: true, note: true },
    }),
    meetingMetrics(
      meeting.residentId,
      meeting.previousMeeting?.meetingDate ?? null,
      meeting.meetingDate,
    ),
  ]);

  const snapshot = {
    takenAt: new Date().toISOString(),
    config: {
      checklists: config.checklists,
      scoreTables: config.scoreTables,
      certifications: config.certifications,
      letterhead: config.letterhead,
      introText: config.introText,
      sectionConfig: config.sectionConfig,
      logoUrl: config.logoUrl,
    },
    scores: scoreRows.map((r) => ({
      tableId: r.tableId,
      sittingAt: r.sittingAt.toISOString(),
      values: r.values,
      note: r.note,
    })),
    checklist: checklistRows.map((c) => ({
      itemId: c.itemId,
      completed: c.completed,
      completedAt: c.completedAt?.toISOString() ?? null,
      note: c.note,
    })),
    // Kept so the left column survives even if the earlier record is later
    // corrected or deleted.
    previousSections: previous,
    previousMeetingDate: meeting.previousMeeting?.meetingDate.toISOString() ?? null,
    metrics,
  };

  const published = await db.pdMeeting.update({
    where: { id: meeting.id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      snapshot: snapshot as object,
    },
    select: { id: true, status: true, publishedAt: true },
  });

  // Hand it to the resident. Failure here must not undo the publish; the
  // record is already on their meetings page either way.
  await createNotification({
    userId: meeting.residentId,
    type: 'pd_meeting.published',
    title: 'Your 1:1 record is ready',
    body: 'Your program director published the record of your meeting. Open it to read and confirm.',
    actionUrl: '/profile/meetings',
  }).catch(() => null);

  await db.auditLog
    .create({
      data: {
        userId: user.id,
        action: 'pd_meeting.published',
        entityType: 'PdMeeting',
        entityId: meeting.id,
        metadata: { residentId: meeting.residentId } as object,
      },
    })
    .catch(() => null);

  return NextResponse.json({
    meeting: {
      id: published.id,
      status: published.status,
      publishedAt: published.publishedAt?.toISOString() ?? null,
    },
  });
}
