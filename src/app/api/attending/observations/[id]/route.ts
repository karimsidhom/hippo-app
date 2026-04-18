import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications/create';
import { sendResidentOutcomeEmail } from '@/lib/notifications/emails';

type RouteContext = { params: Promise<{ id: string }> };

const SignSchema = z.object({
  action: z.enum(['sign', 'return']),
  signedByName:     z.string().optional(),
  returnedReason:   z.string().optional(),
  entrustmentScore: z.number().int().min(1).max(5).optional(),
  achievement:      z.enum(['NOT_ACHIEVED', 'ACHIEVED']).optional(),
  canmedsRatings:   z.array(z.object({
    roleId:    z.string(),
    roleTitle: z.string(),
    rating:    z.number().int().min(1).max(5).nullable(),
  })).optional(),
  strengthsNotes:   z.string().optional(),
  improvementNotes: z.string().optional(),
  safetyConcern:          z.boolean().optional(),
  professionalismConcern: z.boolean().optional(),
  concernDetails:         z.string().optional(),
});

/**
 * GET /api/attending/observations/[id]
 * Loads one EPA observation — caller must be the assessor.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;
  const obs = await db.epaObservation.findFirst({
    where: { id, assessorUserId: user.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      caseLog: {
        select: {
          id: true,
          procedureName: true,
          caseDate: true,
          surgicalApproach: true,
          notes: true,
          reflection: true,
        },
      },
    },
  });

  if (!obs) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(obs);
}

/**
 * POST /api/attending/observations/[id]
 * In-app sign-off or return. Caller must be the assessor.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;
    const existing = await db.epaObservation.findFirst({
      where: { id, assessorUserId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'This observation is not pending review' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = SignSchema.parse(body);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    if (data.action === 'sign') {
      const signData: Record<string, unknown> = {
        status: 'SIGNED',
        signedAt: new Date(),
        signedByName: data.signedByName ?? dbUser?.name ?? dbUser?.email ?? 'Attending',
      };
      if (data.entrustmentScore !== undefined) signData.entrustmentScore = data.entrustmentScore;
      if (data.achievement !== undefined) signData.achievement = data.achievement;
      if (data.canmedsRatings !== undefined) signData.canmedsRatings = data.canmedsRatings;
      if (data.strengthsNotes !== undefined) signData.strengthsNotes = data.strengthsNotes;
      if (data.improvementNotes !== undefined) signData.improvementNotes = data.improvementNotes;
      if (data.safetyConcern !== undefined) signData.safetyConcern = data.safetyConcern;
      if (data.professionalismConcern !== undefined) signData.professionalismConcern = data.professionalismConcern;
      if (data.concernDetails !== undefined) signData.concernDetails = data.concernDetails;

      const [updated] = await db.$transaction([
        db.epaObservation.update({ where: { id }, data: signData }),
        // Mark any open notifications as responded
        db.attendingNotification.updateMany({
          where: { epaObservationId: id, respondedAt: null },
          data: { respondedAt: new Date() },
        }),
      ]);

      void logAudit({
        userId: existing.userId, // resident owns the record
        action: 'epa.sign',
        entityType: 'EpaObservation',
        entityId: id,
        before: existing,
        after: updated,
        metadata: {
          signedByUserId: user.id,
          signedByName: signData.signedByName,
          viaInApp: true,
        },
        req,
      });

      // Notify the resident — "your EPA was verified by Dr. X."
      void createNotification({
        userId: existing.userId,
        type: 'epa.verified',
        title: `EPA verified by ${signData.signedByName as string}`,
        body: `${existing.epaId} · ${existing.epaTitle} — now counts toward your training record.`,
        actionUrl: `/cases?epa=${id}`,
        epaObservationId: id,
      }).catch(err => console.warn('[sign] resident notify failed:', err));

      // Email the resident too — defence against them missing the push
      // while post-call. Respects their email-channel preference via
      // the prefs check below. Fire-and-forget.
      void sendResidentOutcomeEmail({
        residentId: existing.userId,
        kind: 'verified',
        assessorName: signData.signedByName as string,
        epaId: existing.epaId,
        epaTitle: existing.epaTitle,
      });

      return NextResponse.json(updated);
    }

    // return
    const [updated] = await db.$transaction([
      db.epaObservation.update({
        where: { id },
        data: {
          status: 'RETURNED',
          returnedReason: data.returnedReason ?? null,
        },
      }),
      db.attendingNotification.updateMany({
        where: { epaObservationId: id, respondedAt: null },
        data: { respondedAt: new Date() },
      }),
    ]);

    void logAudit({
      userId: existing.userId,
      action: 'epa.update',
      entityType: 'EpaObservation',
      entityId: id,
      before: existing,
      after: updated,
      metadata: {
        transition: 'PENDING_REVIEW→RETURNED',
        returnedByUserId: user.id,
        viaInApp: true,
      },
      req,
    });

    // Notify the resident that their EPA needs edits.
    void createNotification({
      userId: existing.userId,
      type: 'epa.returned',
      title: 'EPA returned for edits',
      body: data.returnedReason
        ? `${existing.epaId}: "${data.returnedReason.slice(0, 120)}"`
        : `${existing.epaId} · ${existing.epaTitle}. Tap to see feedback.`,
      actionUrl: `/cases?epa=${id}`,
      epaObservationId: id,
    }).catch(err => console.warn('[return] resident notify failed:', err));

    const signerName = (await db.user.findUnique({
      where: { id: user.id }, select: { name: true, email: true },
    }))?.name ?? 'your attending';

    void sendResidentOutcomeEmail({
      residentId: existing.userId,
      kind: 'returned',
      assessorName: signerName,
      epaId: existing.epaId,
      epaTitle: existing.epaTitle,
      reason: data.returnedReason ?? null,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[POST /api/attending/observations/[id]]', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
