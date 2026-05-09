import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { buildCsv, csvResponse, type CsvColumn } from '@/lib/reports/csv';
import {
  REPORTS,
  reportEpaMatrix,
  reportCohortHeatmap,
  reportSignoffLatency,
  reportCaseVolume,
  reportSilentDays,
  reportCcDecisions,
  reportFacultyObservations,
  reportDemographics,
  type EpaMatrixRow,
  type CohortRow,
  type LatencyRow,
  type CaseVolumeRow,
  type SilentRow,
  type CcDecisionRow,
  type FacultyObsRow,
  type DemographicsRow,
} from '@/lib/reports/queries';

// ---------------------------------------------------------------------------
// /api/pd/reports/[reportId]?programId=…
//
// Returns a UTF-8 CSV with a Hippo-branded filename, or 404 if the
// reportId is unknown. Only program owners (OWNER / PD) can pull
// reports — they contain cohort-level data we don't want every
// member to see.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

interface ParamsCtx {
  params: Promise<{ reportId: string }>;
}

export async function GET(req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { reportId } = await ctx.params;
  const programId = req.nextUrl.searchParams.get('programId');
  if (!programId) {
    return NextResponse.json({ error: 'programId is required' }, { status: 400 });
  }
  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json(
      { error: 'Only program owners can pull accreditation reports.' },
      { status: 403 },
    );
  }
  const program = await db.program.findUnique({
    where: { id: programId },
    select: { name: true },
  });
  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  const spec = REPORTS.find((r) => r.id === reportId);
  if (!spec) {
    return NextResponse.json({ error: 'Unknown report' }, { status: 404 });
  }

  // Each report has its own typed row shape. We dispatch on the id and
  // build the CSV with the columns specific to that report.
  let csv: string;
  switch (reportId) {
    case 'epa-matrix': {
      const rows = await reportEpaMatrix(programId);
      const cols: CsvColumn<EpaMatrixRow>[] = [
        { header: 'Resident',          value: (r) => r.residentName },
        { header: 'Email',             value: (r) => r.residentEmail },
        { header: 'Training year',     value: (r) => r.trainingYear },
        { header: 'EPA',               value: (r) => r.epaId },
        { header: 'EPA title',         value: (r) => r.epaTitle },
        { header: 'Total observations',value: (r) => r.totalObservations },
        { header: 'Signed',            value: (r) => r.signedObservations },
        { header: 'Achieved',          value: (r) => r.achievedObservations },
        { header: '% Signed',          value: (r) => r.percentSigned },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'cohort-heatmap': {
      const rows = await reportCohortHeatmap(programId);
      const cols: CsvColumn<CohortRow>[] = [
        { header: 'Resident',         value: (r) => r.residentName },
        { header: 'Email',            value: (r) => r.residentEmail },
        { header: 'Training year',    value: (r) => r.trainingYear },
        { header: 'Total EPAs',       value: (r) => r.totalEpas },
        { header: 'Signed EPAs',      value: (r) => r.signedEpas },
        { header: '% Signed',         value: (r) => r.percentSigned },
        { header: 'TD %',             value: (r) => r.td },
        { header: 'F %',              value: (r) => r.f },
        { header: 'COD %',            value: (r) => r.c },
        { header: 'TTP %',            value: (r) => r.ttp },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'signoff-latency': {
      const rows = await reportSignoffLatency(programId);
      const cols: CsvColumn<LatencyRow>[] = [
        { header: 'Attending',        value: (r) => r.attendingName },
        { header: 'Email',            value: (r) => r.attendingEmail },
        { header: 'Observations',     value: (r) => r.observations },
        { header: 'Median days',      value: (r) => r.medianDays },
        { header: 'p90 days',         value: (r) => r.p90Days },
        { header: 'Longest days',     value: (r) => r.longestDays },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'case-volume': {
      const rows = await reportCaseVolume(programId);
      const cols: CsvColumn<CaseVolumeRow>[] = [
        { header: 'Resident',         value: (r) => r.residentName },
        { header: 'Training year',    value: (r) => r.trainingYear },
        { header: 'Procedure',        value: (r) => r.procedureName },
        { header: 'Total',            value: (r) => r.total },
        { header: 'As primary',       value: (r) => r.asPrimary },
        { header: 'As assistant',     value: (r) => r.asAssistant },
        { header: 'As observer',      value: (r) => r.asObserver },
        { header: 'As teacher',       value: (r) => r.asTeacher },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'silent-days': {
      const rows = await reportSilentDays(programId);
      const cols: CsvColumn<SilentRow>[] = [
        { header: 'Resident',                value: (r) => r.residentName },
        { header: 'Email',                   value: (r) => r.residentEmail },
        { header: 'Training year',           value: (r) => r.trainingYear },
        { header: 'Days since last case',    value: (r) => r.daysSinceLastCase ?? '' },
        { header: 'Days since last EPA',     value: (r) => r.daysSinceLastObservation ?? '' },
        { header: 'Silent ≥ 14 days',        value: (r) => (r.silent ? 'Yes' : 'No') },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'cc-decisions': {
      const rows = await reportCcDecisions(programId);
      const cols: CsvColumn<CcDecisionRow>[] = [
        { header: 'Resident',          value: (r) => r.residentName },
        { header: 'Email',             value: (r) => r.residentEmail },
        { header: 'Cycle',             value: (r) => r.cycleLabel },
        { header: 'Meeting date',      value: (r) => r.meetingDate },
        { header: 'Decision',          value: (r) => r.decision },
        { header: 'Status',            value: (r) => r.status },
        { header: 'Decision rationale',value: (r) => r.decisionRationale },
        { header: 'Chair summary',     value: (r) => r.chairSummary },
        { header: 'Dissent',           value: (r) => r.dissent },
        { header: 'Finalised by',      value: (r) => r.finalisedBy },
        { header: 'Finalised at',      value: (r) => r.finalisedAt },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'faculty-observations': {
      const rows = await reportFacultyObservations(programId);
      const cols: CsvColumn<FacultyObsRow>[] = [
        { header: 'Attending',         value: (r) => r.attendingName },
        { header: 'Email',             value: (r) => r.attendingEmail },
        { header: 'Total signed',      value: (r) => r.totalSigned },
        { header: 'Achieved',          value: (r) => r.achieved },
        { header: 'Not achieved',      value: (r) => r.notAchieved },
        { header: 'Average O-Score',   value: (r) => r.avgEntrustment },
        { header: 'Unique residents',  value: (r) => r.uniqueResidents },
        { header: 'Unique EPAs',       value: (r) => r.uniqueEpas },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    case 'demographics': {
      const rows = await reportDemographics(programId);
      const cols: CsvColumn<DemographicsRow>[] = [
        { header: 'Resident',           value: (r) => r.residentName },
        { header: 'Training year',      value: (r) => r.trainingYear },
        { header: 'Total cases',        value: (r) => r.totalCases },
        { header: 'Open',               value: (r) => r.open },
        { header: 'Laparoscopic',       value: (r) => r.laparoscopic },
        { header: 'Robotic',            value: (r) => r.robotic },
        { header: 'Endoscopic',         value: (r) => r.endoscopic },
        { header: 'As primary',         value: (r) => r.asPrimary },
        { header: 'As assistant',       value: (r) => r.asAssistant },
        { header: 'As observer',        value: (r) => r.asObserver },
        { header: 'With complication',  value: (r) => r.withComplication },
      ];
      csv = buildCsv(cols, rows);
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown report' }, { status: 404 });
  }

  return csvResponse(spec.filename(program.name), csv);
}
