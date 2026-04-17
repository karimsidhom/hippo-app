import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import {
  BRAND,
  addCoverSheet,
  addCertificationBlock,
  HIPPO_TRADEMARK_LINE,
} from '@/lib/export-branding';

/**
 * GET /api/epa/export?format=xlsx|csv&from=YYYY-MM-DD&to=YYYY-MM-DD&status=...
 *
 * Bulletproof Royal College-style EPA export. Generates an Excel workbook with:
 *
 *   Sheet 1 — Observations (one row per EPA observation, every CCC field)
 *   Sheet 2 — CanMEDS ratings (long-form, one row per role-rating)
 *   Sheet 3 — Per-criterion ratings (long-form, one row per criterion)
 *   Sheet 4 — Summary (counts by status, EPA, achievement; date range; resident)
 *
 * Designed to be importable into Entrada / One45 / a spreadsheet, and to satisfy
 * a Competence Committee that wants the full longitudinal record.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const format = (sp.get('format') ?? 'xlsx').toLowerCase();
  const from = sp.get('from');
  const to = sp.get('to');
  const status = sp.get('status'); // optional filter

  const where: Record<string, unknown> = { userId: user.id };
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      range.lte = t;
    }
    where.observationDate = range;
  }
  if (status) where.status = status;

  const [observations, profile, dbUser] = await Promise.all([
    db.epaObservation.findMany({
      where,
      include: {
        caseLog: {
          select: {
            procedureName: true,
            caseDate: true,
            surgicalApproach: true,
          },
        },
      },
      orderBy: { observationDate: 'desc' },
    }),
    db.profile.findUnique({ where: { userId: user.id } }),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
  ]);

  void logAudit({
    userId: user.id,
    action: 'epa.export',
    entityType: 'EpaObservation',
    entityId: 'bulk',
    metadata: { format, from, to, status, count: observations.length },
    req,
  });

  // CSV path (universal fallback)
  if (format === 'csv') {
    const csv = buildCsv(observations as unknown as CsvRow[]);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hippo-epa-export-${todayStr()}.csv"`,
      },
    });
  }

  // XLSX path
  const wb = new ExcelJS.Workbook();
  const residentName = dbUser?.name ?? dbUser?.email ?? 'Hippo user';
  const residentEmail = dbUser?.email ?? '';
  wb.creator = 'Hippo Medicine Inc.';
  wb.company = 'Hippo Medicine Inc.';
  wb.title = `${residentName} — EPA Observation Record`;
  wb.created = new Date();

  // ── Sheet 1: Cover ──────────────────────────────────────────────────
  // Branded title page with trainee identity, signature block, and
  // certification statement. Must be added FIRST to land at position 1.
  addCoverSheet(wb, {
    residentName,
    residentEmail,
    pgyYear: profile?.pgyYear ?? null,
    trainingYearLabel: profile?.trainingYearLabel ?? null,
    specialty: profile?.specialty ?? null,
    subspecialty: profile?.subspecialty ?? null,
    institution: profile?.institution ?? null,
    trainingCountry: profile?.trainingCountry ?? null,
    exportType: 'EPA Observation Record',
    dateRangeFrom: from ? new Date(from) : null,
    dateRangeTo: to ? new Date(to) : null,
    totalRecords: observations.length,
  });

  // ── Sheet 2: Observations ──────────────────────────────────────────
  const ws = wb.addWorksheet('EPA Observations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'Observation ID',     key: 'id',                width: 14 },
    { header: 'Date',               key: 'observationDate',   width: 12 },
    { header: 'EPA ID',             key: 'epaId',             width: 8  },
    { header: 'EPA Title',          key: 'epaTitle',          width: 38 },
    { header: 'Training System',    key: 'trainingSystem',    width: 10 },
    { header: 'Stage',              key: 'stage',             width: 8  },
    { header: 'Resident',           key: 'residentName',      width: 22 },
    { header: 'Resident Email',     key: 'residentEmail',     width: 26 },
    { header: 'PGY',                key: 'pgy',               width: 6  },
    { header: 'Specialty',          key: 'specialty',         width: 18 },
    { header: 'Institution',        key: 'institution',       width: 26 },
    { header: 'Assessor Name',      key: 'assessorName',      width: 22 },
    { header: 'Assessor Role',      key: 'assessorRole',      width: 18 },
    { header: 'Assessor Email',     key: 'assessorEmail',     width: 26 },
    { header: 'Setting',            key: 'setting',           width: 12 },
    { header: 'Complexity',         key: 'complexity',        width: 12 },
    { header: 'Technique',          key: 'technique',         width: 18 },
    { header: 'Procedure',          key: 'procedure',         width: 28 },
    { header: 'Approach',           key: 'approach',          width: 14 },
    { header: 'Case Date',          key: 'caseDate',          width: 12 },
    { header: 'O-Score (1\u20135)', key: 'entrustmentScore',  width: 10 },
    { header: 'O-Score Label',      key: 'entrustmentLabel',  width: 16 },
    { header: 'Achievement',        key: 'achievement',       width: 12 },
    { header: 'Status',             key: 'status',            width: 14 },
    { header: 'Signed By',          key: 'signedByName',      width: 22 },
    { header: 'Signed At',          key: 'signedAt',          width: 14 },
    { header: 'Returned Reason',    key: 'returnedReason',    width: 32 },
    { header: 'Observation Notes',  key: 'observationNotes',  width: 40 },
    { header: 'Strengths',          key: 'strengthsNotes',    width: 40 },
    { header: 'For Improvement',    key: 'improvementNotes',  width: 40 },
    { header: 'Safety Concern',     key: 'safetyConcern',     width: 8  },
    { header: 'Professionalism Concern', key: 'professionalismConcern', width: 10 },
    { header: 'Concern Details',    key: 'concernDetails',    width: 40 },
    { header: 'Submitted At',       key: 'createdAt',         width: 14 },
    { header: 'Last Updated',       key: 'updatedAt',         width: 14 },
  ];

  // Header styling — uses shared BRAND tokens so it matches the Cover sheet.
  ws.getRow(1).font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND.TEAL },
  };
  ws.getRow(1).height = 22;
  ws.getRow(1).alignment = { vertical: 'middle' };

  for (const o of observations) {
    ws.addRow({
      id: o.id,
      observationDate: fmtDate(o.observationDate),
      epaId: o.epaId,
      epaTitle: o.epaTitle,
      trainingSystem: o.trainingSystem,
      stage: stageOf(o.epaId),
      residentName: dbUser?.name ?? '',
      residentEmail: dbUser?.email ?? '',
      pgy: profile?.pgyYear ?? '',
      specialty: profile?.specialty ?? '',
      institution: profile?.institution ?? '',
      assessorName: o.assessorName,
      assessorRole: o.assessorRole ?? '',
      assessorEmail: o.assessorEmail ?? '',
      setting: o.setting ?? '',
      complexity: o.complexity ?? '',
      technique: o.technique ?? '',
      procedure: o.caseLog?.procedureName ?? '',
      approach: o.caseLog?.surgicalApproach ?? '',
      caseDate: o.caseLog?.caseDate ? fmtDate(o.caseLog.caseDate) : '',
      entrustmentScore: o.entrustmentScore ?? '',
      entrustmentLabel: o.entrustmentScore ? OSCORE_LABELS[o.entrustmentScore] ?? '' : '',
      achievement: o.achievement === 'ACHIEVED' ? 'Achieved' : 'Not Yet',
      status: STATUS_LABELS[o.status] ?? o.status,
      signedByName: o.signedByName ?? '',
      signedAt: o.signedAt ? fmtDate(o.signedAt) : '',
      returnedReason: o.returnedReason ?? '',
      observationNotes: o.observationNotes ?? '',
      strengthsNotes: o.strengthsNotes ?? '',
      improvementNotes: o.improvementNotes ?? '',
      safetyConcern: o.safetyConcern ? 'Y' : '',
      professionalismConcern: o.professionalismConcern ? 'Y' : '',
      concernDetails: o.concernDetails ?? '',
      createdAt: fmtDate(o.createdAt),
      updatedAt: fmtDate(o.updatedAt),
    });
  }

  // Wrap text on long-form columns
  ['observationNotes', 'strengthsNotes', 'improvementNotes', 'concernDetails', 'returnedReason'].forEach(k => {
    const col = ws.getColumn(k);
    if (col) col.alignment = { wrapText: true, vertical: 'top' };
  });

  // Color rows by status
  ws.eachRow({ includeEmpty: false }, (row, idx) => {
    if (idx === 1) return;
    const status = row.getCell('status').value as string;
    let color: string | null = null;
    if (status === 'Signed') color = 'FFE7F8EE';        // pale green
    else if (status === 'Pending Review') color = 'FFFFF6E1'; // pale amber
    else if (status === 'Returned') color = 'FFFCE7E7';  // pale red
    else if (status === 'Draft') color = 'FFF1F5F9';     // pale gray
    if (color) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    }
  });

  // ── Sheet 2: CanMEDS ratings (long form) ──────────────────────────
  const wsRoles = wb.addWorksheet('CanMEDS Ratings', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  wsRoles.columns = [
    { header: 'Observation ID', key: 'id',           width: 14 },
    { header: 'Date',           key: 'date',         width: 12 },
    { header: 'EPA ID',         key: 'epaId',        width: 8  },
    { header: 'CanMEDS Role',   key: 'roleTitle',    width: 28 },
    { header: 'Role Code',      key: 'roleId',       width: 14 },
    { header: 'Rating (1\u20135)', key: 'rating',    width: 8  },
  ];
  wsRoles.getRow(1).font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
  wsRoles.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.TEAL } };
  wsRoles.getRow(1).height = 22;

  for (const o of observations) {
    if (!Array.isArray(o.canmedsRatings)) continue;
    for (const r of o.canmedsRatings as Array<{ roleId: string; roleTitle: string; rating: number | null }>) {
      wsRoles.addRow({
        id: o.id,
        date: fmtDate(o.observationDate),
        epaId: o.epaId,
        roleTitle: r.roleTitle ?? '',
        roleId: r.roleId ?? '',
        rating: r.rating ?? '',
      });
    }
  }

  // ── Sheet 3: Per-criterion ratings ────────────────────────────────
  const wsCrit = wb.addWorksheet('Criterion Ratings', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  wsCrit.columns = [
    { header: 'Observation ID',     key: 'id',                width: 14 },
    { header: 'Date',               key: 'date',              width: 12 },
    { header: 'EPA ID',             key: 'epaId',             width: 8  },
    { header: 'Criterion',          key: 'label',             width: 50 },
    { header: 'Entrustment Rating', key: 'entrustmentRating', width: 14 },
    { header: 'Comment',            key: 'comment',           width: 40 },
  ];
  wsCrit.getRow(1).font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
  wsCrit.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.TEAL } };
  wsCrit.getRow(1).height = 22;
  wsCrit.getColumn('comment').alignment = { wrapText: true, vertical: 'top' };

  for (const o of observations) {
    if (!Array.isArray(o.criteriaRatings)) continue;
    for (const c of o.criteriaRatings as Array<{ criterionId: string; label: string; entrustmentRating: number | null; comment: string }>) {
      wsCrit.addRow({
        id: o.id,
        date: fmtDate(o.observationDate),
        epaId: o.epaId,
        label: c.label ?? c.criterionId ?? '',
        entrustmentRating: c.entrustmentRating ?? '',
        comment: c.comment ?? '',
      });
    }
  }

  // ── Sheet 4: Summary ──────────────────────────────────────────────
  const wsSum = wb.addWorksheet('Summary');
  wsSum.columns = [
    { header: 'Field', key: 'field', width: 28 },
    { header: 'Value', key: 'value', width: 40 },
  ];
  wsSum.getRow(1).font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
  wsSum.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.TEAL } };
  wsSum.getRow(1).height = 22;

  const counts = countBy(observations.map(o => STATUS_LABELS[o.status] ?? o.status));
  const epaCounts = countBy(observations.map(o => `${o.epaId} \u2014 ${o.epaTitle}`));
  const achievedCount = observations.filter(o => o.achievement === 'ACHIEVED').length;

  wsSum.addRow({ field: 'Resident',           value: dbUser?.name ?? '' });
  wsSum.addRow({ field: 'Resident Email',     value: dbUser?.email ?? '' });
  wsSum.addRow({ field: 'PGY',                value: profile?.pgyYear ?? '' });
  wsSum.addRow({ field: 'Specialty',          value: profile?.specialty ?? '' });
  wsSum.addRow({ field: 'Institution',        value: profile?.institution ?? '' });
  wsSum.addRow({ field: 'Date Range',         value: `${from ?? 'all'} \u2192 ${to ?? 'present'}` });
  wsSum.addRow({ field: 'Generated',          value: new Date().toISOString() });
  wsSum.addRow({ field: '',                   value: '' });
  wsSum.addRow({ field: 'Total Observations', value: observations.length });
  wsSum.addRow({ field: 'Achieved',           value: achievedCount });
  wsSum.addRow({ field: 'Not Yet Achieved',   value: observations.length - achievedCount });
  wsSum.addRow({ field: '',                   value: '' });
  wsSum.addRow({ field: 'Status counts',      value: '' }).font = { bold: true };
  for (const [k, v] of Object.entries(counts)) {
    wsSum.addRow({ field: `   ${k}`, value: v });
  }
  wsSum.addRow({ field: '',                   value: '' });
  wsSum.addRow({ field: 'EPA counts',         value: '' }).font = { bold: true };
  for (const [k, v] of Object.entries(epaCounts).sort()) {
    wsSum.addRow({ field: `   ${k}`, value: v });
  }

  // Certification block on the observations sheet — this is the one a PD
  // reads top-to-bottom, so the signature belongs at its tail.
  addCertificationBlock(ws, residentName);

  // Short privacy footer on the aux sheets so nothing can be excerpted
  // without the disclaimer tagging along.
  for (const sheet of [wsRoles, wsCrit, wsSum]) {
    sheet.addRow([]);
    const tm = sheet.addRow([HIPPO_TRADEMARK_LINE]);
    tm.font = { italic: true, size: 9, color: { argb: BRAND.MUTED }, name: 'Arial' };
    const site = sheet.addRow(['hippomedicine.com']);
    site.font = { size: 9, color: { argb: BRAND.TEAL }, name: 'Arial', underline: true };
  }

  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  const safeName = residentName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const filename = `Hippo-EPA-${safeName}-${todayStr()}.xlsx`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────

const OSCORE_LABELS: Record<number, string> = {
  1: '1 \u2014 Had to do',
  2: '2 \u2014 Talk through',
  3: '3 \u2014 Prompted',
  4: '4 \u2014 Just in case',
  5: '5 \u2014 Independent',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_REVIEW: 'Pending Review',
  SIGNED: 'Signed',
  RETURNED: 'Returned',
};

function fmtDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function stageOf(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith('TTP')) return 'TTP';
  if (id.startsWith('TD'))  return 'TD';
  if (id.startsWith('C'))   return 'Core';
  if (id.startsWith('F'))   return 'Foundations';
  return '';
}

function countBy(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of arr) out[k] = (out[k] ?? 0) + 1;
  return out;
}

type CsvRow = {
  observationDate: Date;
  epaId: string;
  epaTitle: string;
  trainingSystem: string;
  assessorName: string;
  assessorRole: string | null;
  assessorEmail: string | null;
  setting: string | null;
  complexity: string | null;
  technique: string | null;
  caseLog: { procedureName: string; surgicalApproach: string; caseDate: Date } | null;
  entrustmentScore: number | null;
  achievement: string;
  status: string;
  signedByName: string | null;
  signedAt: Date | null;
  returnedReason: string | null;
  observationNotes: string | null;
  strengthsNotes: string | null;
  improvementNotes: string | null;
  safetyConcern: boolean;
  professionalismConcern: boolean;
  concernDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Minimal CSV escape — only the Observations sheet for the universal fallback.
function buildCsv(rows: CsvRow[]): string {
  const headers = [
    'Date', 'EPA ID', 'EPA Title', 'Training System',
    'Assessor Name', 'Assessor Role', 'Assessor Email',
    'Setting', 'Complexity', 'Technique',
    'Procedure', 'Approach', 'Case Date',
    'O-Score', 'Achievement', 'Status',
    'Signed By', 'Signed At', 'Returned Reason',
    'Observation Notes', 'Strengths', 'For Improvement',
    'Safety Concern', 'Professionalism Concern', 'Concern Details',
    'Submitted At', 'Last Updated',
  ];

  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(',')];
  for (const o of rows as Array<Record<string, unknown> & { caseLog: { procedureName?: string; caseDate?: Date; surgicalApproach?: string } | null; observationDate: Date }>) {
    lines.push([
      fmtDate(o.observationDate),
      o.epaId, o.epaTitle, o.trainingSystem,
      o.assessorName, o.assessorRole ?? '', o.assessorEmail ?? '',
      o.setting ?? '', o.complexity ?? '', o.technique ?? '',
      o.caseLog?.procedureName ?? '', o.caseLog?.surgicalApproach ?? '',
      o.caseLog?.caseDate ? fmtDate(o.caseLog.caseDate as Date) : '',
      o.entrustmentScore ?? '', o.achievement === 'ACHIEVED' ? 'Achieved' : 'Not Yet',
      STATUS_LABELS[o.status as string] ?? o.status,
      o.signedByName ?? '', o.signedAt ? fmtDate(o.signedAt as Date) : '',
      o.returnedReason ?? '',
      o.observationNotes ?? '', o.strengthsNotes ?? '', o.improvementNotes ?? '',
      o.safetyConcern ? 'Y' : '', o.professionalismConcern ? 'Y' : '',
      o.concernDetails ?? '',
      fmtDate(o.createdAt as Date), fmtDate(o.updatedAt as Date),
    ].map(escape).join(','));
  }
  return lines.join('\n');
}
