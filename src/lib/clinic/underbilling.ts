/**
 * Under-billing detector.
 *
 * Given the text of a note and the codes that were actually claimed, find
 * the codes in the province's library that the note supports and the claim
 * omits, with the dollar value of each. The matcher is deliberately simple
 * and transparent: a code is "supported" when its short label, or enough of
 * its description's content words, appears in the note. No LLM, so it never
 * invents a code, and every hit shows the phrase that triggered it.
 *
 * Pure; the API route loads the codes from clinic_billing_codes and calls
 * matchUnclaimed(). Unit-tested in scripts/test-underbilling.ts.
 */

export interface BillingCodeRow {
  code: string;
  shortLabel: string;
  description?: string | null;
  modifier?: string | null;
  feeCents?: number | null;
  noteTypes?: string[];
  specialties?: string[];
}

export interface UnclaimedHit {
  code: string;
  shortLabel: string;
  modifier: string | null;
  feeCents: number | null;
  matchedOn: string;
  strength: 'label' | 'description';
  phrase: string;
}

export interface UnderbillingReport {
  claimed: string[];
  unclaimed: UnclaimedHit[];
  unclaimedTotalCents: number;
  /** Claimed codes whose label words do not appear in the note at all. */
  claimedButUnsupported: string[];
}

const STOP = new Set(['the', 'and', 'or', 'of', 'a', 'an', 'to', 'for', 'with', 'in', 'on', 'by', 'per', 'each', 'any', 'all', 'as', 'at', 'from', 'that', 'this', 'is', 'are', 'be', 'not', 'other', 'than', 'more', 'less', 'incl', 'including', 'without', 'first', 'subsequent', 'visit', 'service', 'procedure', 'procedures', 'fee', 'day', 'days', 'hour', 'hours', 'unit', 'units', 'when', 'where', 'which']);

/** Crude stemmer so "insertion" meets "inserted" and "ureteral" meets "ureteric". */
export function stem(w: string): string {
  let x = w;
  for (const suf of ['ation', 'ions', 'ion', 'ing', 'ies', 'ed', 'es', 's', 'al', 'ic', 'ous']) {
    if (x.length > suf.length + 3 && x.endsWith(suf)) {
      x = x.slice(0, -suf.length);
      break;
    }
  }
  return x;
}

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

function sentenceWith(text: string, needle: string): string {
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i === -1) return '';
  const start = Math.max(0, text.lastIndexOf('.', i - 1) + 1);
  const end = text.indexOf('.', i);
  return text.slice(start, end === -1 ? text.length : end + 1).trim();
}

export function codeSupportedByNote(code: BillingCodeRow, noteText: string): { strength: 'label' | 'description'; matchedOn: string; phrase: string } | null {
  const note = noteText.toLowerCase();
  const label = code.shortLabel.trim().toLowerCase();
  if (label.length >= 4 && note.includes(label)) {
    return { strength: 'label', matchedOn: code.shortLabel, phrase: sentenceWith(noteText, label) };
  }
  const desc = words(code.description ?? '');
  const labelWords = words(code.shortLabel);
  const content = [...new Set([...labelWords, ...desc])];
  if (content.length === 0) return null;
  const noteWords = new Set(words(noteText));
  const hits = content.filter((w) => noteWords.has(w));
  // Need most of the label's content words, or a solid majority of a longer description.
  const need = content.length <= 3 ? content.length : Math.ceil(content.length * 0.6);
  if (hits.length >= need && hits.length >= 2) {
    return { strength: 'description', matchedOn: hits.join(' '), phrase: sentenceWith(noteText, hits[0]) };
  }
  return null;
}

export function matchUnclaimed(
  codes: BillingCodeRow[],
  noteText: string,
  claimedCodes: string[],
  ctx: { noteType?: string | null; specialty?: string | null } = {},
): UnderbillingReport {
  const claimed = new Set(claimedCodes.map((c) => c.trim().toUpperCase()));
  const unclaimed: UnclaimedHit[] = [];
  const claimedRows = new Map<string, BillingCodeRow>();

  for (const c of codes) {
    const key = c.code.trim().toUpperCase();
    if (claimed.has(key)) {
      claimedRows.set(key, c);
      continue;
    }
    if (ctx.noteType && c.noteTypes && c.noteTypes.length > 0 && !c.noteTypes.includes(ctx.noteType)) continue;
    if (ctx.specialty && c.specialties && c.specialties.length > 0 && !c.specialties.includes(ctx.specialty)) continue;
    const s = codeSupportedByNote(c, noteText);
    if (s) {
      unclaimed.push({ code: c.code, shortLabel: c.shortLabel, modifier: c.modifier ?? null, feeCents: c.feeCents ?? null, matchedOn: s.matchedOn, strength: s.strength, phrase: s.phrase });
    }
  }
  unclaimed.sort((a, b) => (b.feeCents ?? 0) - (a.feeCents ?? 0) || (a.strength === 'label' ? -1 : 1));

  const claimedButUnsupported: string[] = [];
  for (const [key, row] of claimedRows) {
    if (!codeSupportedByNote(row, noteText)) claimedButUnsupported.push(key);
  }

  return {
    claimed: [...claimed],
    unclaimed,
    unclaimedTotalCents: unclaimed.reduce((a, h) => a + (h.feeCents ?? 0), 0),
    claimedButUnsupported,
  };
}
