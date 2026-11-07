import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * POST /api/account/consent
 * Records that the user has acknowledged the "shadow record" disclosure —
 * i.e. that Hippo is not the official training record unless their program
 * has explicitly adopted it.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await db.profile.update({
    where: { userId: user.id },
    data: { acknowledgedShadowRecordAt: new Date() },
  });

  void logAudit({
    userId: user.id,
    action: 'consent.shadowRecord',
    entityType: 'Profile',
    entityId: profile.id,
    metadata: { acknowledgedAt: profile.acknowledgedShadowRecordAt?.toISOString() },
    req,
  });

  return NextResponse.json({ acknowledgedAt: profile.acknowledgedShadowRecordAt });
}
