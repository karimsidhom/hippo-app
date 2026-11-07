import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/me/meetings
 *
 * The caller's own 1:1 records. Published only: a draft is the director's
 * working copy and the resident has no business seeing it before it is
 * finished. Scoped to the caller by construction, so no role check.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const meetings = await db.pdMeeting.findMany({
    where: { residentId: user.id, status: 'PUBLISHED' },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true,
      meetingDate: true,
      cycleLabel: true,
      pgyAtMeeting: true,
      publishedAt: true,
      acknowledgedAt: true,
      director: { select: { name: true, email: true } },
      program: { select: { name: true } },
    },
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      id: m.id,
      meetingDate: m.meetingDate.toISOString(),
      cycleLabel: m.cycleLabel,
      pgyAtMeeting: m.pgyAtMeeting,
      publishedAt: m.publishedAt?.toISOString() ?? null,
      acknowledgedAt: m.acknowledgedAt?.toISOString() ?? null,
      directorName: m.director.name?.trim() || m.director.email,
      programName: m.program.name,
    })),
  });
}
