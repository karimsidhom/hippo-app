import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { exportSafeTransform } from '@/lib/phia';

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const { year, includeNotes = true, includeReflections = false } = body;

    // Dynamically import ExcelJS to avoid build-time issues
    let ExcelJS: typeof import('exceljs');
    try {
      ExcelJS = await import('exceljs');
    } catch {
      return NextResponse.json({ error: 'ExcelJS not installed. Run: npm install exceljs' }, { status: 500 });
    }

    // ── Fetch real user data from DB ──────────────────────────────────────────
    const [caseLogs, milestones, personalRecords] = await Promise.all([
      db.caseLog.findMany({
        where: { userId: user.id },
        orderBy: { caseDate: 'desc' },
      }),
      db.milestone.findMany({
        where: { userId: user.id },
        orderBy: { achievedAt: 'desc' },
      }),
      db.personalRecord.findMany({
        where: { userId: user.id },
        orderBy: { achievedAt: 'desc' },
      }),
    ]);

    // Apply PHIA-safe transform
    const safeCases = caseLogs.map(c => exportSafeTransform(c as never));
    const filteredCases = year
      ? safeCases.filter(c => c.caseDate && new Date(c.caseDate).getFullYear() === Number(year))
      : safeCases;

    // ── Build workbook ────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hippo';
    workbook.created = new Date();

    // ─── Sheet 1: Master Case Log ─────────────────────────────────────────────
    const caseSheet = workbook.addWorksheet('Case Log');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: any[] = [
      { header: 'Case #',             key: 'id',          width: 10 },
      { header: 'Month',              key: 'month',       width: 12 },
      { header: 'Year',               key: 'year',        width: 8  },
      { header: 'Specialty',          key: 'specialty',   width: 20 },
      { header: 'Procedure',          key: 'procedure',   width: 32 },
      { header: 'Category',           key: 'category',    width: 20 },
      { header: 'Approach',           key: 'approach',    width: 16 },
      { header: 'Role',               key: 'role',        width: 20 },
      { header: 'Autonomy',           key: 'autonomy',    width: 22 },
      { header: 'Difficulty (1-5)',   key: 'difficulty',  width: 16 },
      { header: 'OR Duration (min)',  key: 'duration',    width: 18 },
      { header: 'Console Time (min)', key: 'consoleTime', width: 18 },
      { header: 'Docking Time (min)', key: 'dockingTime', width: 18 },
      { header: 'Attending',          key: 'attending',   width: 16 },
      { header: 'Site',               key: 'site',        width: 26 },
      { header: 'Age Group',          key: 'ageBin',      width: 14 },
      { header: 'Diagnosis Category', key: 'diagnosis',   width: 24 },
      { header: 'Outcome',            key: 'outcome',     width: 16 },
      { header: 'Complication',       key: 'complication',width: 16 },
      { header: 'Conversion',         key: 'conversion',  width: 12 },
    ];
    if (includeNotes)       columns.push({ header: 'Notes (Scrubbed)',      key: 'notes',      width: 32 });
    if (includeReflections) columns.push({ header: 'Reflection (Scrubbed)', key: 'reflection', width: 32 });
    caseSheet.columns = columns;

    const headerRow = caseSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    headerRow.alignment = { vertical: 'middle' };

    filteredCases.forEach((c, idx) => {
      const date = new Date(c.caseDate ?? new Date());
      const rowData: Record<string, unknown> = {
        id:          `HIPPO-${String(idx + 1).padStart(4, '0')}`,
        month:       date.toLocaleString('default', { month: 'long' }),
        year:        date.getFullYear(),
        specialty:   c.specialtyId ?? '',
        procedure:   c.procedureName,
        category:    c.procedureCategory ?? '',
        approach:    c.surgicalApproach,
        role:        c.role,
        autonomy:    c.autonomyLevel,
        difficulty:  c.difficultyScore,
        duration:    c.operativeDurationMinutes ?? '',
        consoleTime: c.consoleTimeMinutes ?? '',
        dockingTime: c.dockingTimeMinutes ?? '',
        attending:   c.attendingLabel ?? '',
        site:        c.institutionSite ?? '',
        ageBin:      c.patientAgeBin,
        diagnosis:   c.diagnosisCategory ?? '',
        outcome:     c.outcomeCategory,
        complication:c.complicationCategory,
        conversion:  c.conversionOccurred ? 'Yes' : 'No',
      };
      if (includeNotes)       rowData.notes      = c.notes ?? '';
      if (includeReflections) rowData.reflection = c.reflection ?? '';

      const row = caseSheet.addRow(rowData);
      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }
    });

    // ─── Sheet 2: Annual Summary ──────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Annual Summary');
    const allYears = [...new Set(
      safeCases.filter(c => c.caseDate).map(c => new Date(c.caseDate!).getFullYear())
    )].sort();

    summarySheet.addRow(['Hippo — Annual Summary Export']);
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.addRow([]);

    allYears.forEach(yr => {
      const yrCases = safeCases.filter(c => c.caseDate && new Date(c.caseDate).getFullYear() === yr);
      const durations = yrCases.map(c => c.operativeDurationMinutes ?? 0).filter(d => d > 0).sort((a, b) => a - b);
      const median = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;
      const avg    = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      summarySheet.addRow([`Year: ${yr}`]).font = { bold: true };
      summarySheet.addRow(['Total Cases', yrCases.length]);
      summarySheet.addRow(['Median OR Time (min)', median]);
      summarySheet.addRow(['Average OR Time (min)', avg]);

      const byRole: Record<string, number> = {};
      yrCases.forEach(c => { const k = c.role ?? 'Unknown'; byRole[k] = (byRole[k] ?? 0) + 1; });
      summarySheet.addRow(['By Role:']).font = { bold: true };
      Object.entries(byRole).forEach(([role, count]) => summarySheet.addRow([`  ${role}`, count]));

      const byApproach: Record<string, number> = {};
      yrCases.forEach(c => { const k = c.surgicalApproach ?? 'Unknown'; byApproach[k] = (byApproach[k] ?? 0) + 1; });
      summarySheet.addRow(['By Approach:']).font = { bold: true };
      Object.entries(byApproach).forEach(([approach, count]) => summarySheet.addRow([`  ${approach}`, count]));

      summarySheet.addRow([]);
    });

    // ─── Sheet 3: Milestones & PRs ───────────────────────────────────────────
    const milestoneSheet = workbook.addWorksheet('Milestones & PRs');
    milestoneSheet.columns = [
      { header: 'Date',      key: 'date',      width: 15 },
      { header: 'Type',      key: 'type',      width: 20 },
      { header: 'Badge',     key: 'badge',     width: 25 },
      { header: 'Procedure', key: 'procedure', width: 28 },
      { header: 'Value',     key: 'value',     width: 15 },
    ];
    milestoneSheet.getRow(1).font = { bold: true };

    milestones.forEach(m => {
      milestoneSheet.addRow({
        date:      new Date(m.achievedAt).toLocaleDateString(),
        type:      'Milestone',
        badge:     m.badgeKey,
        procedure: m.procedureName ?? 'All Procedures',
        value:     m.value,
      });
    });

    personalRecords.forEach(pr => {
      milestoneSheet.addRow({
        date:      new Date(pr.achievedAt).toLocaleDateString(),
        type:      'Personal Record',
        badge:     pr.recordType,
        procedure: pr.procedureName,
        value:     pr.value,
      });
    });

    // ─── Privacy footer on all sheets ─────────────────────────────────────────
    for (const sheet of [caseSheet, summarySheet, milestoneSheet]) {
      sheet.addRow([]);
      const footer = sheet.addRow([
        'PHIA/HIPAA Notice: This export contains no patient identifiers. Do not add patient names, MRNs, or DOBs to this file. Hippo — Privacy by Design.',
      ]);
      footer.font = { italic: true, color: { argb: 'FF6B7280' } };
    }

    // ─── Serialize and return ─────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Hippo-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
