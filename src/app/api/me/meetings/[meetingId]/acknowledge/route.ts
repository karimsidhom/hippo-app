import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * POST /api/me/meetings/[meetingId]/acknowledge
 *
 * The resident confirms they have read the record. This is what replaces
 * printing, signing and scanning: the name and date are denormalised onto
 * the record so the letter prints them even if the resident later changes
 * their name, and so the PDF never has to look anything up.
 *
 * Deliberately not reversible from here. If the director corrects the
 * record after publish, the PATCH route clears the acknowledgment, because
 * the resident acknowledged different words.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { meetingId } = await params;

  const m = await db.pdMeeting.findFirst({
    where: { id: meetingId, residentId: user.id, status: 'PUBLISHED' },
    select: { id: true, acknowledgedAt: true },
  });
  if (!m) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (m.acknowledgedAt) {
    return NextResponse.json({
      acknowledgedAt: m.acknowledgedAt.toISOString(),
      alreadyAcknowledged: true,
    });
  }

  const me = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  const updated = await db.pdMeeting.update({
    where: { id: m.id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedName: me?.name?.trim() || me?.email || null,
    },
    select: { acknowledgedAt: true, acknowledgedName: true },
  });

  await db.auditLog
    .create({
      data: {
        userId: user.id,
        action: 'pd_meeting.acknowledged',
        entityType: 'PdMeeting',
        entityId: m.id,
      },
    })
    .catch(() => null);

  return NextResponse.json({
    acknowledgedAt: updated.acknowledgedAt?.toISOString() ?? null,
    acknowledgedName: updated.acknowledgedName,
    alreadyAcknowledged: false,
  });
}
