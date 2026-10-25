import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { renderMeetingPdf, type MeetingPdfInput } from '@/lib/pd-meeting/pdf';
import { emptySections, GOALS_SECTION_ID, type PdSections } from '@/lib/pd-meeting/types';
import { MANITOBA_UROLOGY_CONFIG } from '@/lib/pd-meeting/defaults';

/** How many page objects the PDF actually contains. */
function pageCount(pdf: Buffer): number {
  // /Type /Pages is the tree node, /Type /Page is a leaf — exclude the former.
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
}

/**
 * PDFKit Flate-compresses its content streams and writes words as hex strings
 * inside TJ arrays, with kerning numbers between the runs. Inflate each
 * stream, then walk the show-text operators keeping only the strings, so
 * "Page 3 of 3" comes back as one piece rather than "P", 40, "age 3 of 3".
 */
function visibleText(pdf: Buffer): string {
  const raw = pdf.toString('latin1');
  const parts: string[] = [];
  const streamRe = /stream\r?\n/g;
  let m: RegExpExecArray | null;

  const readRun = (chunk: string): string => {
    const tokenRe = /<([0-9A-Fa-f]*)>|\(((?:\\.|[^()\\])*)\)/g;
    let out = '';
    let t: RegExpExecArray | null;
    while ((t = tokenRe.exec(chunk))) {
      out += t[1] !== undefined
        ? Buffer.from(t[1], 'hex').toString('latin1')
        : t[2];
    }
    return out;
  };

  while ((m = streamRe.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) continue;
    let content: string;
    try {
      content = inflateSync(
        Buffer.from(raw.slice(start, end), 'latin1'),
      ).toString('latin1');
    } catch {
      continue; // fonts and metadata are not Flate text streams
    }
    for (const arr of content.match(/\[[^\]]*\]\s*TJ/g) ?? []) {
      parts.push(readRun(arr));
    }
    for (const one of content.match(/(?:<[0-9A-Fa-f]*>|\((?:\\.|[^()\\])*\))\s*Tj/g) ?? []) {
      parts.push(readRun(one));
    }
  }
  return parts.join('\n');
}

function bullet(id: string, text: string, extra: Record<string, unknown> = {}) {
  return { id, text, ...extra };
}

/** Short alias used by the later blocks. */
const b = bullet;

function buildInput(over: Partial<MeetingPdfInput> = {}): MeetingPdfInput {
  const previous: PdSections = emptySections();
  previous[GOALS_SECTION_ID] = {
    bullets: [
      bullet('g1', 'Enhance and structure study time.'),
      bullet('g2', 'Submit the stone protocol to REB.'),
      bullet('g3', 'Book the OSCE practice session.'),
    ],
  };
  previous.progress = { bullets: [bullet('p1', 'On track for PGY-3.')] };

  const current: PdSections = emptySections();
  current[GOALS_SECTION_ID] = {
    bullets: [
      bullet('n1', 'Enhance and structure study time.', { carriedFrom: 'g1', outcome: 'partly' }),
      bullet('n2', 'Submit the stone protocol to REB.', { carriedFrom: 'g2', outcome: 'met' }),
      bullet('n3', 'Book the OSCE practice session.', { carriedFrom: 'g3', outcome: 'carried' }),
    ],
  };
  current.progress = { bullets: [bullet('p2', 'Progressing well; autonomy rising.')] };

  return {
    residentName: 'Test Resident',
    pgyAtMeeting: 3,
    meetingDate: new Date('2026-10-20T12:00:00Z'),
    previousMeetingDate: new Date('2025-07-16T12:00:00Z'),
    cycleLabel: 'PGY-3 mid-year',
    directorName: 'Test Director',
    directorTitleLines: ['Program Director'],
    programName: 'Test Urology Program',
    letterhead: MANITOBA_UROLOGY_CONFIG.letterhead ?? null,
    introText: 'We met to review your progress.',
    sections: current,
    previousSections: previous,
    scoreTables: MANITOBA_UROLOGY_CONFIG.scoreTables ?? [],
    scores: [],
    checklists: MANITOBA_UROLOGY_CONFIG.checklists ?? [],
    checklist: {},
    certifications: MANITOBA_UROLOGY_CONFIG.certifications ?? [],
    acknowledgedName: null,
    acknowledgedAt: null,
    ...over,
  };
}

describe('the published letter', () => {
  it('does not append a blank page per footer line', async () => {
    const pdf = await renderMeetingPdf(buildInput());
    const pages = pageCount(pdf);

    // The letter is a handful of pages. The footer loop used to add one page
    // per doc.text() call — two per page — so a 3-page letter rendered as 9.
    expect(pages).toBeGreaterThan(0);
    expect(pages).toBeLessThanOrEqual(5);
  });

  it('numbers every page out of the real total', async () => {
    const pdf = await renderMeetingPdf(buildInput());
    const text = visibleText(pdf);
    const pages = pageCount(pdf);
    expect(text).toContain(`Page 1 of ${pages}`);
    expect(text).toContain(`Page ${pages} of ${pages}`);
  });

  it('prints the outcome this meeting recorded against the goal it answers', async () => {
    const pdf = await renderMeetingPdf(buildInput());
    const text = visibleText(pdf);

    // Outcomes live on THIS meeting's bullets and name the previous goal via
    // carriedFrom; they used to be read off the previous bullets, where the
    // field is never set, so none of them ever reached the page.
    expect(text).toContain('Partly met');
    expect(text).toContain('Met');
    expect(text).toContain('Carried forward');
  });

  it('prints no outcome labels when nothing was answered', async () => {
    const previous: PdSections = emptySections();
    previous[GOALS_SECTION_ID] = { bullets: [bullet('g1', 'A goal nobody answered.')] };
    const current: PdSections = emptySections();
    current[GOALS_SECTION_ID] = { bullets: [bullet('n1', 'A fresh goal.')] };

    const pdf = await renderMeetingPdf(
      buildInput({ sections: current, previousSections: previous }),
    );
    const text = visibleText(pdf);
    expect(text).not.toContain('Partly met');
    expect(text).not.toContain('Carried forward');
  });

  it('renders a first meeting, with no previous column at all', async () => {
    const pdf = await renderMeetingPdf(buildInput({ previousSections: null, previousMeetingDate: null }));
    expect(pageCount(pdf)).toBeGreaterThan(0);
    expect(pageCount(pdf)).toBeLessThanOrEqual(5);
  });
});

describe('answers are not goals', () => {
  it('prints the outcome without restating the answered goal as a new goal', async () => {
    const previous: PdSections = emptySections();
    previous[GOALS_SECTION_ID] = {
      bullets: [
        b('g1', 'Structure dedicated study time.'),
        b('g2', 'Submit the stone protocol to REB.'),
      ],
    };
    const current: PdSections = emptySections();
    current[GOALS_SECTION_ID] = {
      // Both old goals answered; only ONE goal set for the coming interval.
      bullets: [b('n1', 'Begin fellowship applications.')],
      answers: { g1: 'partly', g2: 'met' },
    };

    const pdf = await renderMeetingPdf(
      buildInput({ sections: current, previousSections: previous }),
    );
    const text = visibleText(pdf);

    expect(text).toContain('Partly met');
    expect(text).toContain('Met');
    expect(text).toContain('Begin fellowship applications.');

    // The answered goals are stated once, in the previous column. Answering
    // them must not restate them as goals for the next six months.
    const occurrences = (needle: string) =>
      text.split(needle).length - 1;
    expect(occurrences('Structure dedicated study time.')).toBe(1);
    expect(occurrences('Submit the stone protocol to REB.')).toBe(1);
  });

  it('still reads records written before the answers map existed', async () => {
    const previous: PdSections = emptySections();
    previous[GOALS_SECTION_ID] = { bullets: [b('g1', 'An older goal.')] };
    const current: PdSections = emptySections();
    // The old shape: the outcome rode on a bullet citing the previous goal.
    current[GOALS_SECTION_ID] = {
      bullets: [b('n1', 'An older goal.', { carriedFrom: 'g1', outcome: 'met' })],
    };

    const pdf = await renderMeetingPdf(
      buildInput({ sections: current, previousSections: previous }),
    );
    expect(visibleText(pdf)).toContain('Met');
  });

  it('prefers the answers map when a record carries both', async () => {
    const previous: PdSections = emptySections();
    previous[GOALS_SECTION_ID] = { bullets: [b('g1', 'A goal.')] };
    const current: PdSections = emptySections();
    current[GOALS_SECTION_ID] = {
      bullets: [b('n1', 'A goal.', { carriedFrom: 'g1', outcome: 'met' })],
      answers: { g1: 'not_met' },
    };

    const text = visibleText(
      await renderMeetingPdf(buildInput({ sections: current, previousSections: previous })),
    );
    expect(text).toContain('Not met');
    expect(text).not.toContain('Partly met');
  });
});
