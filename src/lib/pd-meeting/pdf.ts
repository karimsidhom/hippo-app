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
import { PD_SECTIONS, type PdBullet, type PdSections } from './types';
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

const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

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

/** One cell's bullet list, measured or drawn. */
function bulletBlock(
  doc: PDFKit.PDFDocument,
  bullets: PdBullet[],
  x: number,
  y: number,
  w: number,
  opts: { measure?: boolean; showOutcome?: boolean } = {},
): number {
  const pad = 6;
  let cursor = y + pad;
  if (bullets.length === 0) {
    if (!opts.measure) {
      doc.fontSize(9).fillColor(SOFT).text('None', x + pad, cursor, { width: w - pad * 2 });
    }
    return 16 + pad * 2;
  }
  for (const b of bullets) {
    const text = `•  ${b.text}`;
    const h = doc.fontSize(9).heightOfString(text, { width: w - pad * 2 });
    if (!opts.measure) {
      doc.fillColor(INK).text(text, x + pad, cursor, { width: w - pad * 2 });
    }
    cursor += h + 2;
    if (opts.showOutcome && b.outcome) {
      const label = OUTCOME_LABEL[b.outcome] ?? b.outcome;
      const lh = doc.fontSize(8).heightOfString(label, { width: w - pad * 2 - 12 });
      if (!opts.measure) {
        doc.fontSize(8).fillColor(SOFT).text(label, x + pad + 12, cursor, {
          width: w - pad * 2 - 12,
        });
      }
      cursor += lh + 3;
      doc.fontSize(9);
    }
  }
  return cursor - y + pad;
}

/** A section: heading, then the previous meeting beside this one. */
function twoColumnSection(
  doc: PDFKit.PDFDocument,
  heading: string,
  leftLabel: string,
  rightLabel: string,
  left: PdBullet[],
  right: PdBullet[],
  showOutcome: boolean,
) {
  const w = contentWidth(doc);
  const colW = w / 2;
  const x = doc.page.margins.left;

  const headH = doc.fontSize(10).heightOfString(heading, { width: w }) + 6;
  const labelH = 14;
  const leftH = bulletBlock(doc, left, x, 0, colW, { measure: true, showOutcome });
  const rightH = bulletBlock(doc, right, x, 0, colW, { measure: true });
  const bodyH = Math.max(leftH, rightH, 24);

  ensure(doc, headH + labelH + bodyH + 14);
  const top = doc.y;

  doc.fontSize(10).fillColor(INK).font('Helvetica-Bold')
    .text(heading, x, top, { width: w, underline: true });
  doc.font('Helvetica');

  const tableTop = top + headH;

  doc.fontSize(8).fillColor(SOFT);
  doc.text(leftLabel, x + 6, tableTop + 4, { width: colW - 12 });
  doc.text(rightLabel, x + colW + 6, tableTop + 4, { width: colW - 12 });

  const bodyTop = tableTop + labelH;
  bulletBlock(doc, left, x, bodyTop, colW, { showOutcome });
  bulletBlock(doc, right, x + colW, bodyTop, colW);

  const tableBottom = bodyTop + bodyH;
  doc.lineWidth(0.5).strokeColor(RULE);
  doc.rect(x, tableTop, w, tableBottom - tableTop).stroke();
  doc.moveTo(x + colW, tableTop).lineTo(x + colW, tableBottom).stroke();
  doc.moveTo(x, bodyTop).lineTo(x + w, bodyTop).stroke();

  doc.y = tableBottom + 12;
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

  ensure(doc, 20 + rowH * (rows.length + 1) + 16);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(INK)
    .text(def.title, x, doc.y, { width: w });
  doc.font('Helvetica');
  const top = doc.y + 4;

  doc.fontSize(8).fillColor(SOFT);
  cols.forEach((c, i) => doc.text(c.label, x + i * colW + 4, top + 4, { width: colW - 8 }));

  let y = top + rowH;
  doc.fontSize(9).fillColor(INK);
  if (rows.length === 0) {
    doc.fillColor(SOFT).text('No sittings recorded.', x + 4, y + 4, { width: w - 8 });
    y += rowH;
  }
  for (const r of rows) {
    const cells = [fmtShort(new Date(r.sittingAt)), ...def.columns.map((c) => r.values?.[c.id] ?? '')];
    cells.forEach((v, i) => doc.text(v, x + i * colW + 4, y + 4, { width: colW - 8 }));
    y += rowH;
  }

  doc.lineWidth(0.5).strokeColor(RULE);
  doc.rect(x, top, w, y - top).stroke();
  doc.moveTo(x, top + rowH).lineTo(x + w, top + rowH).stroke();
  for (let i = 1; i < cols.length; i++) {
    doc.moveTo(x + i * colW, top).lineTo(x + i * colW, y).stroke();
  }

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

  ensure(doc, 20 + rowH * (def.items.length + 1) + 16);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(INK)
    .text(def.title, x, doc.y, { width: w });
  doc.font('Helvetica');
  const top = doc.y + 4;

  doc.fontSize(8).fillColor(SOFT);
  doc.text('Session', x + 4, top + 4, { width: wSession - 8 });
  if (hasYear) doc.text('To be completed in', x + wSession + 4, top + 4, { width: wYear - 8 });
  doc.text('Completed', x + wSession + wYear + 4, top + 4, { width: wDone - 8 });

  let y = top + rowH;
  for (const item of def.items) {
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

  doc.lineWidth(0.5).strokeColor(RULE);
  doc.rect(x, top, w, y - top).stroke();
  doc.moveTo(x, top + rowH).lineTo(x + w, top + rowH).stroke();
  doc.moveTo(x + wSession, top).lineTo(x + wSession, y).stroke();
  if (hasYear) doc.moveTo(x + wSession + wYear, top).lineTo(x + wSession + wYear, y).stroke();

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
      s.id === 'goals',
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
    for (const c of input.certifications) {
      doc.text(`•  ${c.label}`, x + 6, doc.y + 2, { width: w - 12 });
    }
    doc.moveDown(1);
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
    const fy = doc.page.height - doc.page.margins.bottom + 16;
    doc.fontSize(7).fillColor(SOFT);
    doc.text(
      'Generated by Hippo. Hippo is not the official training record; Entrada remains the system of record.',
      x, fy, { width: w - 60, lineBreak: false },
    );
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, x + w - 60, fy, {
      width: 60, align: 'right', lineBreak: false,
    });
  }

  doc.end();
  return done;
}
