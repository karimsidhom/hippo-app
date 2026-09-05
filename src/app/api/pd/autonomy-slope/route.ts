import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { programSlope, residentSlope, MIN_RESIDENTS_TO_REPORT } from '@/lib/autonomy-slope';
import type { CaseLog } from '@/lib/types';

// ---------------------------------------------------------------------------
// GET /api/pd/autonomy-slope
//
// The autonomy slope for the program director's institution: per-resident
// slopes (anonymized as r1, r2, ...) and the program aggregate, plus a data
// completeness block so the PD can see what is missing before anything is
// published. Only benchmark opt-in cases are used. Aggregates are withheld
// below MIN_RESIDENTS_TO_REPORT residents.
// ---------------------------------------------------------------------------

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const pd = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pd || pd.roleType !== 'PROGRAM_DIRECTOR') {
    return NextResponse.json({ error: 'Program Director role required.' }, { status: 403 });
  }
  if (!pd.institution) return NextResponse.json({ error: 'No institution set.' }, { status: 400 });

  const residents = await db.profile.findMany({
    where: { institution: pd.institution, userId: { not: user.id }, roleType: { in: ['RESIDENT', 'FELLOW'] } },
    select: { userId: true, residencyStartDate: true, allowBenchmarkSharing: true },
  });

  const slopes = [];
  let optedOut = 0;
  for (const r of residents) {
    if (!r.allowBenchmarkSharing) {
      optedOut += 1;
      continue;
    }
    const cases = await db.caseLog.findMany({
      where: { userId: r.userId, benchmarkOptIn: true },
      select: { caseDate: true, autonomyLevel: true },
    });
    slopes.push(residentSlope(r.userId, cases as unknown as CaseLog[], r.residencyStartDate ?? null));
  }

  const aggregate = programSlope(slopes);
  const anonymized = slopes
    .map((s, i) => ({ id: `r${i + 1}`, n: s.n, spanMonths: s.spanMonths, slopePerYear: s.slopePerYear, recentIndependentShare: s.recentIndependentShare, eligible: s.eligible, reason: s.reason }))
    .sort((a, b) => (b.slopePerYear ?? -99) - (a.slopePerYear ?? -99));

  return NextResponse.json({
    institution: pd.institution,
    aggregate,
    residents: anonymized,
    dataCompleteness: {
      residentsTotal: residents.length,
      optedOutOfBenchmarking: optedOut,
      missingResidencyStartDate: slopes.filter((s) => s.reason === 'no residency start date').length,
      belowMinimumCases: slopes.filter((s) => s.reason?.startsWith('fewer than')).length,
      minimumResidentsToReport: MIN_RESIDENTS_TO_REPORT,
      note: 'Publication of program-level slopes requires research ethics approval for secondary use of opt-in data; this endpoint exists so the data are complete when that approval is sought.',
    },
  });
}
