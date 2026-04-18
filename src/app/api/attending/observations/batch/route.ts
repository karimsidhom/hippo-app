import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications/create';
import { sendResidentOutcomeEmail } from '@/lib/notifications/emails';

// ---------------------------------------------------------------------------
// POST /api/attending/observations/batch
//
// Bulk sign-off OR bulk return. One HTTP call, N observations, one audit
// entry per observation, one notification per resident.
//
// Before this endpoint existed the client POSTed to the single-observation
// route in a for-loop; that worked but had three problems:
//   1. N round-trips — slow for 50+ EPAs.
//   2. Partial-failure ambiguity — if round 13 of 50 failed, the client
//      didn't know which succeeded.
//   3. Every call hit the audit log + notification pipeline separately,
//      producing unevenly-timed bursts.
//
// The batch endpoint processes inside a single Prisma $transaction per
// observation (keeps each sign/return atomic), but sequences them so we
// can report per-observation success in the response. Notifications and
// emails fan out fire-and-forget AFTER the HTTP response.
// ---------------------------------------------------------------------------

const ItemSchema = z.object({
  id: z.string().cuid(),
  // For sign: optional per-item grade. For return: ignored.
  entrustmentScore: z.number().int().min(1).max(5).optional(),
  achievement: z.enum(['NOT_ACHIEVED', 'ACHIEVED']).optional(),
});

const BodySchema = z.object({
  action: z.enum(['sign', 'return']),
  items: z.array(ItemSchema).min(1).max(200),
  // For returns: required. For signs: ignored.
  returnedReason: z.string().max(2000).optional(),
  /** Attending's display name override (defaults to their User.name). */
  signedByName: z.string().optional(),
  /** When true, attending accepts a zero-confirmation bulk action. */
  confirmed: z.boolean(),
});

interface BatchResult {
  id: string;
  ok: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action, items, returnedReason, signedByName, confirmed } = parsed.data;
  if (!confirmed) {
    return NextResponse.json(
      { error: 'Batch action requires explicit confirmation' },
      { status: 400 },
    );
  }
  if (action === 'return' && !returnedReason) {
    return NextResponse.json(
      { error: 'A reason is required when returning EPAs' },
      { status: 400 },
    );
  }

  // Pre-filter to observations this attending is actually allowed to
  // touch. Single query rather than N.
  const ids = items.map(i => i.id);
  const owned = await db.epaObservation.findMany({
    where: { id: { in: ids }, assessorUserId: user.id, status: 'PENDING_REVIEW' },
  });
  const ownedMap = new Map(owned.map(o => [o.id, o]));

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });
  const signerName = signedByName ?? dbUser?.name ?? dbUser?.email ?? 'Attending';

  const results: BatchResult[] = [];
  const signedObservations: typeof owned = [];
  const returnedObservations: typeof owned = [];

  // Controlled parallelism. Prisma sits on Supabase's pgbouncer which
  // can handle ~15-20 concurrent transactions; 5 is well below that and
  // cuts a 70-EPA batch from ~7s to ~1.4s without hammering the pool.
  const CONCURRENCY = 5;
  const workQueue = [...items];

  async function processOne(item: typeof items[number]) {
    const existing = ownedMap.get(item.id);
    if (!existing) {
      results.push({ id: item.id, ok: false, error: 'Not found or not pending' });
      return;
    }
    try {
      if (action === 'sign') {
        const signData: Record<string, unknown> = {
          status: 'SIGNED',
          signedAt: new Date(),
          signedByName: signerName,
        };
        if (item.entrustmentScore !== undefined) signData.entrustmentScore = item.entrustmentScore;
        if (item.achievement !== undefined) signData.achievement = item.achievement;

        const [updated] = await db.$transaction([
          db.epaObservation.update({ where: { id: existing.id }, data: signData }),
          db.attendingNotification.updateMany({
            where: { epaObservationId: existing.id, respondedAt: null },
            data: { respondedAt: new Date() },
          }),
        ]);

        void logAudit({
          userId: existing.userId,
          action: 'epa.sign',
          entityType: 'EpaObservation',
          entityId: existing.id,
          before: existing,
          after: updated,
          metadata: { signedByUserId: user.id, signedByName: signerName, viaBatch: true },
          req,
        });

        signedObservations.push(updated);
        results.push({ id: existing.id, ok: true });
      } else {
        const [updated] = await db.$transaction([
          db.epaObservation.update({
            where: { id: existing.id },
            data: { status: 'RETURNED', returnedReason: returnedReason! },
          }),
          db.attendingNotification.updateMany({
            where: { epaObservationId: existing.id, respondedAt: null },
            data: { respondedAt: new Date() },
          }),
        ]);

        void logAudit({
          userId: existing.userId,
          action: 'epa.update',
          entityType: 'EpaObservation',
          entityId: existing.id,
          before: existing,
          after: updated,
          metadata: {
            transition: 'PENDING_REVIEW→RETURNED',
            returnedByUserId: user.id,
            viaBatch: true,
          },
          req,
        });

        returnedObservations.push(updated);
        results.push({ id: existing.id, ok: true });
      }
    } catch (err) {
      results.push({
        id: item.id,
        ok: false,
        error: err instanceof Error ? err.message : 'Update failed',
      });
    }
  }

  // Worker pool: CONCURRENCY parallel consumers of workQueue.
  async function worker() {
    while (workQueue.length > 0) {
      const item = workQueue.shift();
      if (!item) return;
      await processOne(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()));

  // Fan-out notifications + emails in parallel, fire-and-forget. We've
  // already returned a complete result set — if notification delivery
  // fails for some residents, the primary action still landed.
  for (const obs of signedObservations) {
    void createNotification({
      userId: obs.userId,
      type: 'epa.batch_signed',
      title: `EPA verified by ${signerName}`,
      body: `${obs.epaId} · ${obs.epaTitle} — signed as part of a batch.`,
      actionUrl: `/cases?epa=${obs.id}`,
      epaObservationId: obs.id,
    });
    void sendResidentOutcomeEmail({
      residentId: obs.userId,
      kind: 'verified',
      assessorName: signerName,
      epaId: obs.epaId,
      epaTitle: obs.epaTitle,
    });
  }
  for (const obs of returnedObservations) {
    void createNotification({
      userId: obs.userId,
      type: 'epa.returned',
      title: 'EPA returned for edits',
      body: `${obs.epaId}: "${returnedReason!.slice(0, 120)}"`,
      actionUrl: `/cases?epa=${obs.id}`,
      epaObservationId: obs.id,
    });
    void sendResidentOutcomeEmail({
      residentId: obs.userId,
      kind: 'returned',
      assessorName: signerName,
      epaId: obs.epaId,
      epaTitle: obs.epaTitle,
      reason: returnedReason ?? null,
    });
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    action,
    succeeded,
    failed,
    total: results.length,
    results,
  });
}
