import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isUnlocked, type PricingTier } from '@/lib/pricing';
import { projectAll, suggestTargetsFromLog, type CaseTargetDef, type TargetMatchType } from '@/lib/projections';
import type { CaseLog } from '@/lib/types';

// ---------------------------------------------------------------------------
// /api/targets — "On track" case targets and projections (Pro)
//
//   GET    → { targets: TargetProgress[], suggestions, graduationDate, tier, gated }
//   POST   → create a target { label, matchType, matchValue?, target, dueDate? }
//            or set the graduation date { graduationDate }
//   DELETE → ?id=<targetId>
//
// Free users can see the card with the gate closed (so the upsell is
// visible) but cannot create targets. The projection math lives in
// src/lib/projections.ts and is unit-tested in scripts/test-projections.ts.
// ---------------------------------------------------------------------------

const MATCH_TYPES: TargetMatchType[] = ['TOTAL', 'CATEGORY', 'PROCEDURE', 'INDEPENDENT'];

async function loadContext(userId: string) {
  const [profile, cases, rows] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      select: { tier: true, expectedGraduation: true },
    }),
    db.caseLog.findMany({ where: { userId }, orderBy: { caseDate: 'desc' } }),
    db.caseTarget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ]);
  const tier = ((profile?.tier ?? 'free') as PricingTier);
  const targets: CaseTargetDef[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    matchType: r.matchType as TargetMatchType,
    matchValue: r.matchValue,
    target: r.target,
    dueDate: r.dueDate,
  }));
  return { profile, tier, cases: cases as unknown as CaseLog[], targets };
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  try {
    const { profile, tier, cases, targets } = await loadContext(user.id);
    const gated = !isUnlocked(tier, 'onTrack');
    const graduationDate = profile?.expectedGraduation ?? null;
    return NextResponse.json({
      gated,
      tier,
      graduationDate,
      targets: gated ? [] : projectAll(cases, targets, { graduationDate }),
      suggestions: suggestTargetsFromLog(cases),
    });
  } catch (err) {
    console.error('[targets] GET', err);
    return NextResponse.json({ error: 'Could not load targets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json().catch(() => ({}));
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { tier: true } });
    const tier = ((profile?.tier ?? 'free') as PricingTier);
    if (!isUnlocked(tier, 'onTrack')) {
      return NextResponse.json({ error: 'On-track projections are a Pro feature', gated: true }, { status: 402 });
    }

    if (body.graduationDate !== undefined) {
      const d = body.graduationDate ? new Date(body.graduationDate) : null;
      if (d && Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Bad graduation date' }, { status: 400 });
      }
      await db.profile.update({ where: { userId: user.id }, data: { expectedGraduation: d } });
      if (body.label === undefined) return NextResponse.json({ ok: true, graduationDate: d });
    }

    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : '';
    const matchType = body.matchType as TargetMatchType;
    const matchValue = typeof body.matchValue === 'string' ? body.matchValue.trim().slice(0, 120) : null;
    const target = Number(body.target);
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (!label) return NextResponse.json({ error: 'Label required' }, { status: 400 });
    if (!MATCH_TYPES.includes(matchType)) return NextResponse.json({ error: 'Bad matchType' }, { status: 400 });
    if ((matchType === 'CATEGORY' || matchType === 'PROCEDURE') && !matchValue) {
      return NextResponse.json({ error: 'matchValue required for this matchType' }, { status: 400 });
    }
    if (!Number.isInteger(target) || target < 1 || target > 100000) {
      return NextResponse.json({ error: 'Target must be a whole number between 1 and 100000' }, { status: 400 });
    }
    if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: 'Bad due date' }, { status: 400 });

    const count = await db.caseTarget.count({ where: { userId: user.id } });
    if (count >= 40) return NextResponse.json({ error: 'Maximum of 40 targets' }, { status: 400 });

    const row = await db.caseTarget.create({
      data: { userId: user.id, label, matchType, matchValue: matchType === 'TOTAL' || matchType === 'INDEPENDENT' ? null : matchValue, target, dueDate },
    });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    console.error('[targets] POST', err);
    return NextResponse.json({ error: 'Could not save target' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const res = await db.caseTarget.deleteMany({ where: { id, userId: user.id } });
    if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[targets] DELETE', err);
    return NextResponse.json({ error: 'Could not delete target' }, { status: 500 });
  }
}
