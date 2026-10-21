import { requireAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { loadMeetingForDirector } from '@/lib/pd-meeting/access';
import { meetingPdfFilename, renderMeetingPdfById } from '@/lib/pd-meeting/build-pdf-input';

// pdfkit needs Node, not the edge runtime.
export const runtime = 'nodejs';

/**
 * GET /api/pd/meetings/[meetingId]/pdf
 * The letter, for the director. A draft renders as a preview.
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

  const pdf = await renderMeetingPdfById(meetingId);
  if (!pdf) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const name = meetingPdfFilename(
    meeting.resident.name?.trim() || meeting.resident.email,
    meeting.meetingDate,
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
