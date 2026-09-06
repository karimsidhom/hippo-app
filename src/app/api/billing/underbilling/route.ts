import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { matchUnclaimed, type BillingCodeRow } from '@/lib/clinic/underbilling';
import { getRegionProcedureLibrary, getRegionDisclaimer, isRegionCode } from '@/lib/dictation/billing/regions';

// ---------------------------------------------------------------------------
// POST /api/billing/underbilling
//
// Body: { text: string, claimed: string[], province?: string, noteType?: string }
//
// Compares a note against every billing code the province library knows
// (the clinic_billing_codes table plus the in-code procedure libraries that
// were transcribed from the public provincial fee schedules) and returns the
// codes the note supports but the claim omits, priced. Physician-verification
// material only: the disclaimer for the region is returned with every result
// and must be shown.
// ---------------------------------------------------------------------------

function dollarsToCents(fee?: string | null): number | null {
  if (!fee) return null;
  const n = Number(String(fee).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text : '';
    const claimed: string[] = Array.isArray(body.claimed) ? body.claimed.filter((c: unknown) => typeof c === 'string') : [];
    if (text.trim().length < 20) return NextResponse.json({ error: 'Note text required' }, { status: 400 });

    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { billingRegion: true, billingEnabled: true, specialty: true } });
    const province = (typeof body.province === 'string' && body.province) || profile?.billingRegion || null;
    if (!province || !isRegionCode(province)) {
      return NextResponse.json({ error: 'Set a billing province in Clinic settings first', configured: false }, { status: 400 });
    }

    // 1. Codes the clinic module holds for this province (global + this user's additions).
    const dbCodes = await db.clinicBillingCode.findMany({
      where: { province, isActive: true, OR: [{ ownerUserId: null }, { ownerUserId: user.id }] },
      select: { code: true, shortLabel: true, description: true, modifier: true, feeCents: true, noteTypes: true, specialties: true },
    });

    // 2. The in-code procedure library transcribed from the provincial schedule.
    const lib = getRegionProcedureLibrary(province);
    const libCodes: BillingCodeRow[] = [];
    const seen = new Set(dbCodes.map((c) => c.code.toUpperCase()));
    for (const profileEntry of Object.values(lib)) {
      for (const c of profileEntry.codes) {
        if (seen.has(c.code.toUpperCase())) continue;
        seen.add(c.code.toUpperCase());
        libCodes.push({
          code: c.code,
          shortLabel: c.label.length <= 60 ? c.label : profileEntry.displayName,
          description: `${profileEntry.displayName}. ${c.label}`,
          feeCents: dollarsToCents(c.fee),
          noteTypes: [],
          specialties: [],
        });
      }
    }

    const codes: BillingCodeRow[] = [...dbCodes, ...libCodes];
    const report = matchUnclaimed(codes, text, claimed, {
      noteType: typeof body.noteType === 'string' ? body.noteType : null,
      specialty: profile?.specialty ?? null,
    });

    return NextResponse.json({
      province,
      codesConsidered: codes.length,
      report,
      disclaimer: getRegionDisclaimer(province),
    });
  } catch (err) {
    console.error('[billing/underbilling]', err);
    return NextResponse.json({ error: 'Could not run the under-billing check' }, { status: 500 });
  }
}
