// ---------------------------------------------------------------------------
// The letter.
//
// Renders a published PdMeeting as the three-page document the programme
// already signs: letterhead, RE line, the eight two-column sections with the
// previous meeting beside this one, the cumulative score tables, the
// curriculum checklists, certifications, and two signature blocks.
//
// Everything is read from the meeting's snapshot, which publish froze, so a
// record printed in 2029 shows 2029's numbers and not today's.
// ---------------------------------------------------------------------------
import PDFDocument from 'pdfkit';
import {
  answersOf,
  GOALS_SECTION_ID,
  PD_SECTIONS,
  type PdBullet,
  type PdSections,
} from './types';
import type {
  CertificationDef,
  ChecklistDef,
  LetterheadDef,
  ScoreTableDef,
} from './types';

const PAGE = { size: 'LETTER' as const, margin: 54 };
const INK = '#111111';
const SOFT = '#555555';
const RULE = '#bbbbbb';
const HILITE = '#fff3bf'; // the yellow the paper letter uses for an overdue row

export interface MeetingPdfInput {
  residentName: string;
  pgyAtMeeting: number | null;
  meetingDate: Date;
  previousMeetingDate: Date | null;
  cycleLabel: string | null;
  directorName: string | null;
  directorTitleLines: string[];
  programName: string;
  letterhead: LetterheadDef | null;
  introText: string | null;
  sections: PdSections;
  previousSections: PdSections | null;
  scoreTables: ScoreTableDef[];
  scores: { tableId: string; sittingAt: string; values: Record<string, string> }[];
  checklists: ChecklistDef[];
  checklist: Record<string, { completed: boolean }>;
  certifications: CertificationDef[];
  acknowledgedName: string | null;
  acknowledgedAt: Date | null;
}

/** Tidy an account display name for print. Whitespace only: the letter
 *  must not invent a spelling the account does not have. */
const tidyName = (n: string) => n.replace(/\s+/g, ' ').trim();

// Pinned to UTC on purpose. A sitting date is typed as a bare "2026-05-03"
// and stored as UTC midnight, so formatting it in the server's zone prints
// the day before anywhere west of Greenwich — and the letter is rendered on
// Vercel, not on the director's laptop. These are calendar dates, not
// instants, so UTC is the zone they were written in.
const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });

const OUTCOME_LABEL: Record<string, string> = {
  met: 'Met',
  partly: 'Partly met',
  not_met: 'Not met',
  carried: 'Carried forward',
};

function bulletsOf(s: PdSections | null, id: string): PdBullet[] {
  const v = s?.[id];
  return Array.isArray(v?.bullets) ? v.bullets : [];
}

/** Width available between the margins. */
function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/** Start a new page when the next block will not fit. */
function ensure(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

interface CellLine {
  /** Drawn at the cell's left padding. */
  text: string;
  size: number;
  colour: string;
  /** Extra left inset, used by the outcome line under a goal. */
  inset: number;
  /** Height of this line plus the gap after it. */
  height: number;
}

/**
 * Flatten a column's bullets into drawable lines with their heights.
 *
 * Measuring up front is what lets the caller break a long section across
 * pages. The old code advanced a cursor by hand and drew at absolute
 * positions, so once the cursor passed the bottom margin PDFKit started a
 * fresh page per doc.text() call and the overflow arrived as a run of
 * near-empty pages with the section border drawn off the bottom of one.
 */
function measureColumn(
  doc: PDFKit.PDFDocument,
  bullets: PdBullet[],
  w: number,
  opts: { showOutcome?: boolean; outcomes?: Record<string, string> } = {},
): CellLine[] {
  const pad = 6;
  const inner = w - pad * 2;
  const lines: CellLine[] = [];

  // "+ Add a point" inserts an empty bullet and the autosave stores it, so a
  // point started and abandoned mid-meeting would otherwise print as a naked
  // bullet glyph on the signed letter.
  const shown = bullets.filter((b) => b.text.trim().length > 0);

  if (shown.length === 0) {
    return [{
      text: 'None',
      size: 9,
      colour: SOFT,
      inset: 0,
      height: doc.fontSize(9).heightOfString('None', { width: inner }) + 2,
    }];
  }

  for (const b of shown) {
    const text = `•  ${b.text}`;
    lines.push({
      text,
      size: 9,
      colour: INK,
      inset: 0,
      height: doc.fontSize(9).heightOfString(text, { width: inner }) + 2,
    });

    // The outcome of a goal is recorded against the previous bullet's id in
    // the section's answers map, so it is looked up rather than read off the
    // bullet, where it is only ever set on the new side.
    const outcome = opts.outcomes ? opts.outcomes[b.id] : b.outcome;
    if (opts.showOutcome && outcome) {
      const label = OUTCOME_LABEL[outcome] ?? outcome;
      lines.push({
        text: label,
        size: 8,
        colour: SOFT,
        inset: 12,
        height: doc.fontSize(8).heightOfString(label, { width: inner - 12 }) + 3,
      });
    }
  }
  doc.fontSize(9);
  return lines;
}

/** Draw as many of a column's remaining lines as fit. Returns where it got to. */
function drawColumnSlice(
  doc: PDFKit.PDFDocument,
  lines: CellLine[],
  from: number,
  x: number,
  top: number,
  w: number,
  available: number,
): { next: number; used: number } {
  const pad = 6;
  let cursor = top + pad;
  let i = from;
  const limit = top + available;

  while (i < lines.length) {
    const line = lines[i];
    // Always place at least one line, or a line taller than a whole page
    // would stall the loop forever.
    if (cursor + line.height > limit && i > from) break;
    doc.fontSize(line.size).fillColor(line.colour).text(
      line.text,
      x + pad + line.inset,
      cursor,
      { width: w - pad * 2 - line.inset },
    );
    cursor += line.height;
    i += 1;
  }

  doc.fontSize(9).fillColor(INK);
  return { next: i, used: cursor - top + pad };
}

/**
 * A section: heading, then the previous meeting beside this one.
 *
 * Breaks across pages when it has to, repeating the two column labels, so a
 * section with more points than fit on a page reads as a continued table
 * rather than a scatter of orphans.
 */
function twoColumnSection(
  doc: PDFKit.PDFDocument,
  heading: string,
  leftLabel: string,
  rightLabel: string,
  left: PdBullet[],
  right: PdBullet[],
  showOutcome: boolean,
  /** Goals only: previous-bullet id -> what this meeting recorded about it. */
  answers: Record<string, string> = {},
) {
  const w = contentWidth(doc);
  const colW = w / 2;
  const x = doc.page.margins.left;
  const outcomes: Record<string, string> = showOutcome ? answers : {};

  const leftLines = measureColumn(doc, left, colW, { showOutcome, outcomes });
  const rightLines = measureColumn(doc, right, colW);

  const headH = doc.fontSize(10).heightOfString(heading, { width: w }) + 6;
  const labelH = 14;

  // Enough room for the heading, the labels and a first line of body, or the
  // section starts on the next page rather than stranding its heading.
  ensure(doc, headH + labelH + 30);

  doc.fontSize(10).fillColor(INK).font('Helvetica-Bold')
    .text(heading, x, doc.y, { width: w, underline: true });
  doc.font('Helvetica');

  let li = 0;
  let ri = 0;
  let firstSlice = true;

  while (firstSlice || li < leftLines.length || ri < rightLines.length) {
    const tableTop = firstSlice ? doc.y : doc.page.margins.top;

    doc.fontSize(8).fillColor(SOFT);
    doc.text(firstSlice ? leftLabel : `${leftLabel} (continued)`, x + 6, tableTop + 4, {
      width: colW - 12,
    });
    doc.text(firstSlice ? rightLabel : `${rightLabel} (continued)`, x + colW + 6, tableTop + 4, {
      width: colW - 12,
    });

    const bodyTop = tableTop + labelH;
    const available = doc.page.height - doc.page.margins.bottom - bodyTop - 12;

    const l = drawColumnSlice(doc, leftLines, li, x, bodyTop, colW, available);
    const r = drawColumnSlice(doc, rightLines, ri, x + colW, bodyTop, colW, available);
    li = l.next;
    ri = r.next;

    const bodyH = Math.max(l.used, r.used, 24);
    const tableBottom = bodyTop + bodyH;

    doc.lineWidth(0.5).strokeColor(RULE);
    doc.rect(x, tableTop, w, tableBottom - tableTop).stroke();
    doc.moveTo(x + colW, tableTop).lineTo(x + colW, tableBottom).stroke();
    doc.moveTo(x, bodyTop).lineTo(x + w, bodyTop).stroke();

    doc.y = tableBottom + 12;
    firstSlice = false;

    if (li < leftLines.length || ri < rightLines.length) doc.addPage();
  }

  doc.fillColor(INK);
}

/** A cumulative score table: date first, then the programme's own columns. */
function scoreTable(
  doc: PDFKit.PDFDocument,
  def: ScoreTableDef,
  rows: { sittingAt: string; values: Record<string, string> }[],
) {
  const w = contentWidth(doc);
  const x = doc.page.margins.left;
  const cols = [{ id: '__date', label: 'Date' }, ...def.columns];
  const colW = w / cols.length;
  const rowH = 16;

  // Room for the title, the header row and a couple of rows. More than that
  // is handled by breaking the table, not by assuming it all fits: a long
  // table used to advance y past the bottom margin, after which PDFKit put
  // every remaining cell on a page of its own.
  ensure(doc, 20 + rowH * 3 + 16);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(INK)
    .text(def.title, x, doc.y, { width: w });
  doc.font('Helvetica');

  let top = doc.y + 4;
  let y = 0;

  const header = () => {
    doc.fontSize(8).fillColor(SOFT);
    cols.forEach((c, i) => doc.text(c.label, x + i * colW + 4, top + 4, { width: colW - 8 }));
    doc.fontSize(9).fillColor(INK);
    y = top + rowH;
  };

  const close = () => {
    doc.lineWidth(0.5).strokeColor(RULE);
    doc.rect(x, top, w, y - top).stroke();
    doc.moveTo(x, top + rowH).lineTo(x + w, top + rowH).stroke();
    for (let i = 1; i < cols.length; i++) {
      doc.moveTo(x + i * colW, top).lineTo(x + i * colW, y).stroke();
    }
  };

  header();

  if (rows.length === 0) {
    doc.fillColor(SOFT).text('No sittings recorded.', x + 4, y + 4, { width: w - 8 });
    doc.fillColor(INK);
    y += rowH;
  }

  for (const r of rows) {
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      close();
      doc.addPage();
      top = doc.page.margins.top;
      header();
    }
    const cells = [fmtShort(new Date(r.sittingAt)), ...def.columns.map((c) => r.values?.[c.id] ?? '')];
    cells.forEach((v, i) => doc.text(v, x + i * colW + 4, y + 4, { width: colW - 8 }));
    y += rowH;
  }

  close();
  doc.y = y + 14;
  doc.fillColor(INK);
}

/** A checklist: session, the year it is due, and a tick. */
function checklistTable(
  doc: PDFKit.PDFDocument,
  def: ChecklistDef,
  state: Record<string, { completed: boolean }>,
  pgy: number | null,
) {
  const w = contentWidth(doc);
  const x = doc.page.margins.left;
  const hasYear = def.items.some((i) => i.targetYear);
  const wSession = hasYear ? w * 0.6 : w * 0.8;
  const wYear = hasYear ? w * 0.22 : 0;
  const wDone = w - wSession - wYear;
  const rowH = 16;

  // As with the score table: room for a header and a couple of rows, then
  // break properly rather than letting the cursor run past the margin.
  ensure(doc, 20 + rowH * 3 + 16);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(INK)
    .text(def.title, x, doc.y, { width: w });
  doc.font('Helvetica');

  let top = doc.y + 4;
  let y = 0;

  const header = () => {
    doc.fontSize(8).fillColor(SOFT);
    doc.text('Session', x + 4, top + 4, { width: wSession - 8 });
    if (hasYear) doc.text('To be completed in', x + wSession + 4, top + 4, { width: wYear - 8 });
    doc.text('Completed', x + wSession + wYear + 4, top + 4, { width: wDone - 8 });
    doc.fontSize(9).fillColor(INK);
    y = top + rowH;
  };

  const close = () => {
    doc.lineWidth(0.5).strokeColor(RULE);
    doc.rect(x, top, w, y - top).stroke();
    doc.moveTo(x, top + rowH).lineTo(x + w, top + rowH).stroke();
    doc.moveTo(x + wSession, top).lineTo(x + wSession, y).stroke();
    if (hasYear) doc.moveTo(x + wSession + wYear, top).lineTo(x + wSession + wYear, y).stroke();
  };

  header();

  for (const item of def.items) {
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      close();
      doc.addPage();
      top = doc.page.margins.top;
      header();
    }
    const done = state[item.id]?.completed ?? false;
    // The paper letter highlights a row still outstanding past its year.
    const due = item.targetYear ? Math.max(...(item.targetYear.match(/\d+/g) ?? ['0']).map(Number)) : null;
    const overdue = !done && due !== null && pgy !== null && pgy > due;
    if (overdue) {
      doc.rect(x, y, w, rowH).fill(HILITE);
      doc.fillColor(INK);
    }
    doc.fontSize(9).fillColor(INK);
    doc.text(item.label, x + 4, y + 4, { width: wSession - 8, ellipsis: true });
    if (hasYear) {
      doc.text(item.targetYear ?? '', x + wSession + 4, y + 4, { width: wYear - 8 });
    }
    if (done) {
      // Drawn, not typed: U+2713 is absent from Helvetica's WinAnsi
      // encoding and renders as an apostrophe.
      const cx = x + wSession + wYear + 8;
      const cy = y + rowH / 2;
      doc.save().lineWidth(1.1).strokeColor(INK)
        .moveTo(cx, cy).lineTo(cx + 3, cy + 3).lineTo(cx + 9, cy - 4).stroke().restore();
    }
    y += rowH;
  }

  close();
  doc.y = y + 14;
  doc.fillColor(INK);
}

export function renderMeetingPdf(input: MeetingPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ ...PAGE, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const w = contentWidth(doc);
  const x = doc.page.margins.left;

  // ── Letterhead ──────────────────────────────────────────────────────
  const lines = input.letterhead?.lines ?? [input.programName];
  doc.fontSize(9).fillColor(INK).font('Helvetica-Bold')
    .text(lines[0] ?? '', x, doc.y, { width: w, align: 'right' });
  doc.font('Helvetica').fillColor(SOFT);
  for (const l of lines.slice(1)) {
    doc.text(l, x, doc.y, { width: w, align: 'right' });
  }
  doc.moveDown(1.2);
  doc.lineWidth(0.5).strokeColor(RULE)
    .moveTo(x, doc.y).lineTo(x + w, doc.y).stroke();
  doc.moveDown(1);

  // ── Date and RE line ────────────────────────────────────────────────
  doc.fontSize(10).fillColor(INK).text(fmtLong(input.meetingDate), x, doc.y, { width: w });
  doc.moveDown(1);

  const pgy = input.pgyAtMeeting ? ` PGY${input.pgyAtMeeting}` : '';
  doc.font('Helvetica-Bold').text(
    `RE: Program Director – Resident 1:1 meeting for Dr. ${tidyName(input.residentName)}${pgy}`,
    x, doc.y, { width: w, align: 'center' },
  );
  doc.font('Helvetica');
  if (input.cycleLabel) {
    doc.fontSize(9).fillColor(SOFT)
      .text(input.cycleLabel, x, doc.y + 2, { width: w, align: 'center' });
  }
  doc.moveDown(1.2);

  doc.fontSize(10).fillColor(INK).text(`Dr. ${tidyName(input.residentName)},`, x, doc.y, { width: w });
  doc.moveDown(0.6);
  if (input.introText) {
    doc.text(input.introText, x, doc.y, { width: w, align: 'left' });
    doc.moveDown(1);
  }

  // ── The eight sections ──────────────────────────────────────────────
  const leftLabel = input.previousMeetingDate
    ? fmtLong(input.previousMeetingDate)
    : 'No previous meeting';
  const rightLabel = fmtLong(input.meetingDate);

  for (const s of PD_SECTIONS) {
    twoColumnSection(
      doc, s.label, leftLabel, rightLabel,
      bulletsOf(input.previousSections, s.id),
      bulletsOf(input.sections, s.id),
      s.id === GOALS_SECTION_ID,
      answersOf(input.sections, s.id),
    );
  }

  // ── Scores, curriculum, certifications ──────────────────────────────
  for (const t of input.scoreTables) {
    scoreTable(doc, t, input.scores.filter((r) => r.tableId === t.id));
  }
  for (const c of input.checklists) {
    checklistTable(doc, c, input.checklist, input.pgyAtMeeting);
  }

  if (input.certifications.length) {
    ensure(doc, 20 + input.certifications.length * 14 + 10);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(INK)
      .text('Certifications', x, doc.y, { width: w });
    doc.font('Helvetica').fontSize(9);
    doc.moveDown(0.2);
    // Rendered through the checklist table so each one carries its tick.
    // They used to print as four bare words, identical on every letter for
    // every resident, because nothing recorded whether they were done.
    checklistTable(
      doc,
      {
        id: 'certifications',
        title: '',
        items: input.certifications.map((c) => ({ id: `cert:${c.id}`, label: c.label })),
      },
      input.checklist,
      input.pgyAtMeeting,
    );
  }

  // ── Signatures ──────────────────────────────────────────────────────
  ensure(doc, 120);
  doc.moveDown(2);
  const sigY = doc.y + 30;
  const colW = w / 2;
  doc.lineWidth(0.7).strokeColor(INK);
  doc.moveTo(x, sigY).lineTo(x + colW - 24, sigY).stroke();
  doc.moveTo(x + colW, sigY).lineTo(x + w, sigY).stroke();

  doc.fontSize(9).fillColor(INK).font('Helvetica-Bold')
    .text(input.directorName ? tidyName(input.directorName) : 'Program Director', x, sigY + 5, { width: colW - 24 });
  doc.font('Helvetica').fillColor(SOFT).fontSize(8);
  for (const l of input.directorTitleLines) {
    doc.text(l, x, doc.y, { width: colW - 24 });
  }

  const residentBlockY = sigY + 5;
  doc.fontSize(9).fillColor(INK).font('Helvetica-Bold')
    .text(`Dr. ${tidyName(input.residentName)}`, x + colW, residentBlockY, { width: colW });
  doc.font('Helvetica').fillColor(SOFT).fontSize(8);
  if (input.acknowledgedAt) {
    doc.text(
      `Acknowledged in Hippo by ${tidyName(input.acknowledgedName ?? input.residentName)} on ${fmtLong(input.acknowledgedAt)}`,
      x + colW, doc.y, { width: colW },
    );
  } else {
    doc.text('Awaiting acknowledgment', x + colW, doc.y, { width: colW });
  }

  // ── Footer on every page ────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // A footer sits below the bottom margin by definition, and PDFKit starts
    // a new page whenever text would cross that margin — so each of these two
    // calls was appending one. A three-page letter came out as nine, six of
    // them blank but for a stray footer line. Dropping the margin while we
    // write into it is the documented way round, and it is restored straight
    // after so nothing else sees a changed page box.
    const keepBottom = doc.page.margins.bottom;
    const fy = doc.page.height - keepBottom + 16;
    doc.page.margins.bottom = 0;
    doc.fontSize(7).fillColor(SOFT);
    doc.text(
      'Generated by Hippo. Hippo is not the official training record; Entrada remains the system of record.',
      x, fy, { width: w - 60, lineBreak: false },
    );
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, x + w - 60, fy, {
      width: 60, align: 'right', lineBreak: false,
    });
    doc.page.margins.bottom = keepBottom;
  }

  doc.end();
  return done;
}
