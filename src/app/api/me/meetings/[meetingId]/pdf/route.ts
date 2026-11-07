import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { meetingPdfFilename, renderMeetingPdfById } from '@/lib/pd-meeting/build-pdf-input';

export const runtime = 'nodejs';

/**
 * GET /api/me/meetings/[meetingId]/pdf
 * The resident's own copy. Published records only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { meetingId } = await params;

  const m = await db.pdMeeting.findFirst({
    where: { id: meetingId, residentId: user.id, status: 'PUBLISHED' },
    select: { id: true, meetingDate: true, resident: { select: { name: true, email: true } } },
  });
  if (!m) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const pdf = await renderMeetingPdfById(meetingId);
  if (!pdf) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const name = meetingPdfFilename(m.resident.name?.trim() || m.resident.email, m.meetingDate);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
