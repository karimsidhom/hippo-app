import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { exportSafeTransform } from '@/lib/phia';
import {
  BRAND,
  addCoverSheet,
  addCertificationBlock,
  HIPPO_TRADEMARK_LINE,
} from '@/lib/export-branding';

// ---------------------------------------------------------------------------
// POST /api/export — Hippo Case Log Excel export
//
// Produces a formal, RCPSC / ACGME-friendly surgical case log workbook that
// residents can hand to their PD, submit for fellowship applications, or
// attach to an evaluation binder. Four sheets:
//
//   1. Cover            — formal title page + trainee identity + signature
//   2. Case Log         — every case, one row, RCPSC-aligned columns
//   3. Annual Summary   — year-by-year counts, median OR time, role breakdown
//   4. Milestones & PRs — achievements + personal records
//
// All PHI is scrubbed at query time via exportSafeTransform(). The cover
// sheet carries the Hippo™ wordmark and a signed certification statement so
// the document reads as a single formal training record, not a spreadsheet
// dump.
// ---------------------------------------------------------------------------

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
      return NextResponse.json(
        { error: 'ExcelJS not installed. Run: npm install exceljs' },
        { status: 500 },
      );
    }

    // ── Fetch real user data from DB ────────────────────────────────────
    // Resident identity (for the cover sheet) + case log rows + badges.
    // All parallelised — this route is already slow-ish because of the
    // workbook serialisation, so don't serialise the DB round-trips.
    const [caseLogs, milestones, personalRecords, dbUser, profile] =
      await Promise.all([
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
        db.user.findUnique({
          where: { id: user.id },
          select: { name: true, email: true },
        }),
        db.profile.findUnique({
          where: { userId: user.id },
          select: {
            roleType: true,
            specialty: true,
            subspecialty: true,
            institution: true,
            trainingCountry: true,
            pgyYear: true,
            trainingYearLabel: true,
          },
        }),
      ]);

    // Apply PHIA-safe transform to every row.
    const safeCases = caseLogs.map((c) => exportSafeTransform(c as never));
    const filteredCases = year
      ? safeCases.filter(
          (c) => c.caseDate && new Date(c.caseDate).getFullYear() === Number(year),
        )
      : safeCases;

    const residentName = dbUser?.name ?? dbUser?.email ?? 'Hippo user';
    const residentEmail = dbUser?.email ?? user.email ?? '';

    // ── Build workbook ──────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hippo Medicine Inc.';
    workbook.company = 'Hippo Medicine Inc.';
    workbook.title = `${residentName} — Surgical Case Log`;
    workbook.created = new Date();

    // ── Sheet 1: Cover ──────────────────────────────────────────────────
    // Branded title page. Must be added FIRST so it lands at position 1.
    addCoverSheet(workbook, {
      residentName,
      residentEmail,
      pgyYear: profile?.pgyYear ?? null,
      trainingYearLabel: profile?.trainingYearLabel ?? null,
      specialty: profile?.specialty ?? null,
      subspecialty: profile?.subspecialty ?? null,
      institution: profile?.institution ?? null,
      trainingCountry: profile?.trainingCountry ?? null,
      exportType: 'Surgical Case Log',
      dateRangeFrom: filteredCases.length
        ? new Date(
            Math.min(
              ...filteredCases
                .filter((c) => c.caseDate)
                .map((c) => new Date(c.caseDate!).getTime()),
            ),
          )
        : null,
      dateRangeTo: filteredCases.length
        ? new Date(
            Math.max(
              ...filteredCases
                .filter((c) => c.caseDate)
                .map((c) => new Date(c.caseDate!).getTime()),
            ),
          )
        : null,
      totalRecords: filteredCases.length,
    });

    // ── Sheet 2: Master Case Log ────────────────────────────────────────
    const caseSheet = workbook.addWorksheet('Case Log', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    // RCPSC-aligned column ordering: identity → procedure → role/autonomy →
    // operative detail → outcomes → optional narrative. This matches what
    // a Competence Committee or fellowship reviewer looks for top-to-bottom.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: any[] = [
      { header: 'Case #',             key: 'id',          width: 11 },
      { header: 'Date',               key: 'date',        width: 12 },
      { header: 'Month',              key: 'month',       width: 12 },
      { header: 'Year',               key: 'year',        width: 8  },
      { header: 'Specialty',          key: 'specialty',   width: 20 },
      { header: 'Procedure',          key: 'procedure',   width: 34 },
      { header: 'Category',           key: 'category',    width: 20 },
      { header: 'Approach',           key: 'approach',    width: 15 },
      { header: 'Role',               key: 'role',        width: 20 },
      { header: 'Autonomy',           key: 'autonomy',    width: 22 },
      { header: 'Difficulty (1-5)',   key: 'difficulty',  width: 14 },
      { header: 'OR Duration (min)',  key: 'duration',    width: 16 },
      { header: 'Console Time (min)', key: 'consoleTime', width: 16 },
      { header: 'Docking Time (min)', key: 'dockingTime', width: 16 },
      { header: 'Attending',          key: 'attending',   width: 18 },
      { header: 'Site',               key: 'site',        width: 26 },
      { header: 'Age Group',          key: 'ageBin',      width: 14 },
      { header: 'Diagnosis Category', key: 'diagnosis',   width: 24 },
      { header: 'Outcome',            key: 'outcome',     width: 18 },
      { header: 'Complication',       key: 'complication',width: 18 },
      { header: 'Conversion',         key: 'conversion',  width: 12 },
    ];
    if (includeNotes) columns.push({ header: 'Notes (PHIA-scrubbed)', key: 'notes', width: 36 });
    if (includeReflections) columns.push({ header: 'Reflection (PHIA-scrubbed)', key: 'reflection', width: 36 });
    caseSheet.columns = columns;

    // Header row — Hippo teal with white text, matches the cover sheet
    // divider colour so the document reads as one visual system.
    const headerRow = caseSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.TEAL } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 22;

    filteredCases.forEach((c, idx) => {
      const date = c.caseDate ? new Date(c.caseDate) : null;
      const rowData: Record<string, unknown> = {
        id:           `HIPPO-${String(idx + 1).padStart(4, '0')}`,
        date:         date ? date.toISOString().slice(0, 10) : '',
        month:        date ? date.toLocaleString('default', { month: 'long' }) : '',
        year:         date ? date.getFullYear() : '',
        specialty:    c.specialtyId ?? '',
        procedure:    c.procedureName,
        category:     c.procedureCategory ?? '',
        approach:     c.surgicalApproach,
        role:         c.role,
        autonomy:     c.autonomyLevel,
        difficulty:   c.difficultyScore,
        duration:     c.operativeDurationMinutes ?? '',
        consoleTime:  c.consoleTimeMinutes ?? '',
        dockingTime:  c.dockingTimeMinutes ?? '',
        attending:    c.attendingLabel ?? '',
        site:         c.institutionSite ?? '',
        ageBin:       c.patientAgeBin,
        diagnosis:    c.diagnosisCategory ?? '',
        outcome:      c.outcomeCategory,
        complication: c.complicationCategory,
        conversion:   c.conversionOccurred ? 'Yes' : 'No',
      };
      if (includeNotes) rowData.notes = c.notes ?? '';
      if (includeReflections) rowData.reflection = c.reflection ?? '';

      const row = caseSheet.addRow(rowData);
      row.font = { name: 'Arial', size: 10, color: { argb: BRAND.INK } };
      // Zebra striping for scannability.
      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.ZEBRA } };
      }
    });

    // Wrap long narrative columns so the full text is visible on print.
    if (includeNotes) caseSheet.getColumn('notes').alignment = { wrapText: true, vertical: 'top' };
    if (includeReflections) caseSheet.getColumn('reflection').alignment = { wrapText: true, vertical: 'top' };

    // Certification + signature block at the bottom of the data sheet.
    addCertificationBlock(caseSheet, residentName);

    // ── Sheet 3: Annual Summary ─────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Annual Summary');
    const allYears = [
      ...new Set(
        safeCases.filter((c) => c.caseDate).map((c) => new Date(c.caseDate!).getFullYear()),
      ),
    ].sort();

    // Title block
    summarySheet.getCell('A1').value = 'Annual Summary';
    summarySheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: BRAND.INK } };
    summarySheet.getRow(1).height = 24;
    summarySheet.getCell('A2').value = `${residentName} · Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    summarySheet.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: BRAND.MUTED }, italic: true };
    summarySheet.getRow(3).height = 6;

    allYears.forEach((yr) => {
      const yrCases = safeCases.filter(
        (c) => c.caseDate && new Date(c.caseDate).getFullYear() === yr,
      );
      const durations = yrCases
        .map((c) => c.operativeDurationMinutes ?? 0)
        .filter((d) => d > 0)
        .sort((a, b) => a - b);
      const median =
        durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;
      const avg =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

      const yrHeader = summarySheet.addRow([`Year: ${yr}`]);
      yrHeader.font = { name: 'Arial', size: 13, bold: true, color: { argb: BRAND.TEAL } };
      yrHeader.height = 22;

      summarySheet.addRow(['Total Cases', yrCases.length]);
      summarySheet.addRow(['Median OR Time (min)', median]);
      summarySheet.addRow(['Average OR Time (min)', avg]);

      const byRole: Record<string, number> = {};
      yrCases.forEach((c) => {
        const k = c.role ?? 'Unknown';
        byRole[k] = (byRole[k] ?? 0) + 1;
      });
      const roleHeader = summarySheet.addRow(['By Role:']);
      roleHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: BRAND.INK_2 } };
      Object.entries(byRole).forEach(([role, count]) =>
        summarySheet.addRow([`   ${role}`, count]),
      );

      const byApproach: Record<string, number> = {};
      yrCases.forEach((c) => {
        const k = c.surgicalApproach ?? 'Unknown';
        byApproach[k] = (byApproach[k] ?? 0) + 1;
      });
      const apHeader = summarySheet.addRow(['By Approach:']);
      apHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: BRAND.INK_2 } };
      Object.entries(byApproach).forEach(([approach, count]) =>
        summarySheet.addRow([`   ${approach}`, count]),
      );

      summarySheet.addRow([]);
    });

    summarySheet.getColumn(1).width = 32;
    summarySheet.getColumn(2).width = 14;

    // ── Sheet 4: Milestones & PRs ───────────────────────────────────────
    const milestoneSheet = workbook.addWorksheet('Milestones & PRs');
    milestoneSheet.columns = [
      { header: 'Date',      key: 'date',      width: 14 },
      { header: 'Type',      key: 'type',      width: 18 },
      { header: 'Badge',     key: 'badge',     width: 26 },
      { header: 'Procedure', key: 'procedure', width: 30 },
      { header: 'Value',     key: 'value',     width: 12 },
    ];
    const mHeader = milestoneSheet.getRow(1);
    mHeader.font = { bold: true, color: { argb: BRAND.WHITE }, size: 11, name: 'Arial' };
    mHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.TEAL } };
    mHeader.alignment = { vertical: 'middle' };
    mHeader.height = 22;

    milestones.forEach((m) => {
      milestoneSheet.addRow({
        date: new Date(m.achievedAt).toLocaleDateString(),
        type: 'Milestone',
        badge: m.badgeKey,
        procedure: m.procedureName ?? 'All Procedures',
        value: m.value,
      });
    });
    personalRecords.forEach((pr) => {
      milestoneSheet.addRow({
        date: new Date(pr.achievedAt).toLocaleDateString(),
        type: 'Personal Record',
        badge: pr.recordType,
        procedure: pr.procedureName,
        value: pr.value,
      });
    });

    // ── Global privacy footer on all data sheets ────────────────────────
    // Three-line footer: PHIA notice, trademark, website. Consistent
    // placement across every sheet so no one can accidentally share a
    // slice of the workbook without the disclosure attached.
    for (const sheet of [caseSheet, summarySheet, milestoneSheet]) {
      sheet.addRow([]);
      const phia = sheet.addRow([
        'PHIA / HIPAA Notice: this export contains no patient identifiers. ' +
          'Do not add patient names, medical record numbers, or dates of birth to this file.',
      ]);
      phia.font = { italic: true, size: 9, color: { argb: BRAND.MUTED }, name: 'Arial' };

      const tm = sheet.addRow([HIPPO_TRADEMARK_LINE]);
      tm.font = { italic: true, size: 9, color: { argb: BRAND.MUTED }, name: 'Arial' };

      const site = sheet.addRow(['hippomedicine.com']);
      site.font = { size: 9, color: { argb: BRAND.TEAL }, name: 'Arial', underline: true };
    }

    // ── Serialise ───────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const safeName = residentName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `Hippo-CaseLog-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
