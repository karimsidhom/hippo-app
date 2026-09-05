/**
 * Dictate once, derive everything.
 *
 * Takes the free text of an operative note (dictated through Hippo Rise or
 * pasted from anywhere) and derives a draft case-log entry, a suggested
 * autonomy level with the sentences that justify it, and a suggested EPA
 * entrustment score. Pure: no DB, no network, no LLM. The resident confirms
 * the draft; nothing is saved without a human click.
 *
 * Design rules:
 *  - Every derived field carries its evidence (the phrase it came from) so
 *    the reviewer can see why, and a confidence so the UI can highlight
 *    what to double-check.
 *  - When the text is ambiguous the field is left empty rather than guessed.
 *  - Procedure matching uses the Hippo procedure library names and aliases,
 *    longest match first, so "laparoscopic cholecystectomy" beats "cholecystectomy".
 */

import { PROCEDURE_LIBRARY, type Procedure } from '../procedureLibrary';
import type { AutonomyLevel, ComplicationCategory, OutcomeCategory, SurgicalApproach } from '../types';

export interface Evidence {
  value: string;
  phrase: string;
  confidence: number; // 0 to 1
}

export interface DerivedCase {
  procedure: (Evidence & { procedureId: string | null; category: string | null; specialty: string | null }) | null;
  approach: (Evidence & { value: SurgicalApproach }) | null;
  autonomyLevel: (Evidence & { value: AutonomyLevel }) | null;
  role: (Evidence & { value: 'PRIMARY' | 'ASSIST' | 'OBSERVER' | 'TEACHING' }) | null;
  attendingLabel: Evidence | null;
  operativeDurationMinutes: (Evidence & { minutes: number }) | null;
  conversionOccurred: boolean;
  complicationCategory: ComplicationCategory;
  outcomeCategory: OutcomeCategory;
  /** Suggested EPA entrustment (O-score style 1 to 5), from the autonomy language. */
  suggestedEntrustment: { score: 1 | 2 | 3 | 4 | 5; label: string; phrase: string } | null;
  /** Fields the reviewer should look at because the text was thin or contradictory. */
  warnings: string[];
}

const ENTRUSTMENT_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'I had to do',
  2: 'I had to talk them through',
  3: 'I had to prompt them from time to time',
  4: 'I needed to be in the room just in case',
  5: 'I did not need to be there',
};

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function sentenceAround(text: string, idx: number): string {
  const start = Math.max(0, text.lastIndexOf('.', idx - 1) + 1);
  const endDot = text.indexOf('.', idx);
  const end = endDot === -1 ? text.length : endDot + 1;
  return text.slice(start, end).trim();
}

// ── Procedure ──────────────────────────────────────────────────────────────

function candidateNames(p: Procedure): string[] {
  return [p.name, ...(p.aliases ?? [])].map(norm).filter((n) => n.length >= 4);
}

export function deriveProcedure(text: string, specialtyHint?: string | null) {
  const t = norm(text);
  let best: { p: Procedure; name: string; idx: number } | null = null;
  const pool = specialtyHint
    ? PROCEDURE_LIBRARY.filter((p) => p.active && p.specialty === specialtyHint)
    : PROCEDURE_LIBRARY.filter((p) => p.active);
  for (const p of pool) {
    for (const name of candidateNames(p)) {
      const idx = t.indexOf(name);
      if (idx === -1) continue;
      if (!best || name.length > best.name.length || (name.length === best.name.length && idx < best.idx)) {
        best = { p, name, idx };
      }
    }
  }
  if (!best) return null;
  // Prefer a match that appears in the first 600 characters (the header) when several are tied.
  const conf = best.idx < 600 ? 0.9 : 0.7;
  return {
    value: best.p.name,
    phrase: sentenceAround(text, Math.max(0, text.toLowerCase().indexOf(best.name))),
    confidence: conf,
    procedureId: best.p.id,
    category: best.p.category,
    specialty: best.p.specialty,
  };
}

// ── Approach ───────────────────────────────────────────────────────────────

const APPROACH_PATTERNS: [SurgicalApproach, RegExp][] = [
  ['ROBOTIC', /\b(robot(ic)?(-assisted)?|da vinci|console)\b/i],
  ['LAPAROSCOPIC', /\b(laparoscop(y|ic)|pneumoperitoneum|trocar|port[- ]site)\b/i],
  ['PERCUTANEOUS', /\b(percutaneous|nephrostomy tract|pcnl)\b/i],
  ['ENDOSCOPIC', /\b(cystoscop(y|ic)|ureteroscop(y|ic)|endoscop(y|ic)|resectoscope|scope was (advanced|passed))\b/i],
  ['OPEN', /\b(midline (incision|laparotomy)|laparotomy|open (approach|repair|procedure)|incision was made|kocher|pfannenstiel|flank incision)\b/i],
];

export function deriveApproach(text: string) {
  const hits: { value: SurgicalApproach; idx: number; phrase: string }[] = [];
  for (const [value, re] of APPROACH_PATTERNS) {
    const m = re.exec(text);
    if (m) hits.push({ value, idx: m.index, phrase: sentenceAround(text, m.index) });
  }
  if (hits.length === 0) return null;
  // Conversion: laparoscopic or robotic mentioned AND "converted to open".
  const converted = /\bconver(ted|sion) to (an )?open\b/i.test(text);
  hits.sort((a, b) => a.idx - b.idx);
  const primary = converted ? hits.find((h) => h.value !== 'OPEN') ?? hits[0] : hits[0];
  const value: SurgicalApproach = converted ? 'HYBRID' : primary.value;
  return { value, phrase: primary.phrase, confidence: hits.length === 1 || converted ? 0.85 : 0.6 };
}

export function deriveConversion(text: string): boolean {
  return /\bconver(ted|sion) to (an )?open\b/i.test(text);
}

// ── Autonomy and role ──────────────────────────────────────────────────────

const AUTONOMY_PATTERNS: { level: AutonomyLevel; role: DerivedCase['role'] extends infer R ? (R extends { value: infer V } ? V : never) : never; score: 1 | 2 | 3 | 4 | 5; re: RegExp }[] = [
  { level: 'TEACHING', role: 'TEACHING', score: 5, re: /\b(resident|fellow|trainee|I) (supervised|taught|walked .* through|guided) (the )?(junior|resident|student|pgy)/i },
  { level: 'INDEPENDENT', role: 'PRIMARY', score: 5, re: /\b(performed|completed) (the )?(entire |whole )?(procedure|operation|case)[^.]{0,40}\bindependently\b|\bindependently performed\b|\bwithout (staff|attending|the attending) (present|scrubbed|in the room)\b|\battending (was )?available but not scrubbed\b/i },
  { level: 'SUPERVISOR_PRESENT', role: 'PRIMARY', score: 4, re: /\b(resident|fellow|I) performed (the )?(procedure|operation|case|key steps|critical steps|anastomosis|dissection)[^.]*\b(under (direct )?supervision|with (the )?(staff|attending) (present|scrubbed|in the room|supervising))\b|\bunder (direct |the )?supervision of\b|\battending (was )?present (for|throughout)\b/i },
  { level: 'SUPERVISOR_PRESENT', role: 'PRIMARY', score: 3, re: /\b(resident|fellow|I) performed (the )?(procedure|operation|case|majority|most|key steps|critical steps)\b/i },
  { level: 'ASSISTANT', role: 'ASSIST', score: 2, re: /\b(resident|fellow|I) (first[- ])?assist(ed|ing)\b|\bassisted (by|with)\b|\b(the )?(attending|staff) performed (the )?(procedure|operation|case|majority|key steps|critical steps)\b/i },
  { level: 'OBSERVER', role: 'OBSERVER', score: 1, re: /\b(observed|observer|watched the (procedure|case|operation))\b/i },
];

export function deriveAutonomy(text: string) {
  const hits = AUTONOMY_PATTERNS.map((p) => ({ p, m: p.re.exec(text) })).filter((x) => x.m);
  if (hits.length === 0) return { autonomy: null, role: null, entrustment: null, contradictory: false };
  // Highest-specificity first: the order of AUTONOMY_PATTERNS is by strength; take the first hit
  // but note contradiction if both an independent and an assistant phrase appear.
  const levels = new Set(hits.map((h) => h.p.level));
  const contradictory = (levels.has('INDEPENDENT') || levels.has('TEACHING')) && (levels.has('ASSISTANT') || levels.has('OBSERVER'));
  const top = hits[0];
  const phrase = sentenceAround(text, top.m!.index);
  const confidence = contradictory ? 0.4 : hits.length === 1 ? 0.85 : 0.7;
  return {
    autonomy: { value: top.p.level, phrase, confidence },
    role: { value: top.p.role, phrase, confidence },
    entrustment: { score: top.p.score, label: ENTRUSTMENT_LABEL[top.p.score], phrase },
    contradictory,
  };
}

// ── Attending, duration, complications ─────────────────────────────────────

export function deriveAttending(text: string) {
  const m = /\b(attending|staff|surgeon|consultant)(?: surgeon)?:?\s*(?:was\s+)?(dr\.?\s+[A-Z][a-zA-Z'-]+)/i.exec(text) ?? /\b(dr\.?\s+[A-Z][a-zA-Z'-]+)\b[^.]{0,40}\b(attending|staff|supervis)/i.exec(text);
  if (!m) return null;
  const name = (m[2] ?? m[1]).replace(/\s+/g, ' ');
  return { value: name.replace(/^dr\.?\s*/i, 'Dr. '), phrase: sentenceAround(text, m.index), confidence: 0.7 };
}

export function deriveDuration(text: string) {
  const m = /\b(operative|procedure|total|skin[- ]to[- ]skin|case) (time|duration)[^0-9]{0,20}(\d{1,3})\s*(min|minutes|h|hr|hours?)\b/i.exec(text)
    ?? /\b(\d{1,3})\s*(min|minutes)\b[^.]{0,30}\b(skin[- ]to[- ]skin|operative time)\b/i.exec(text)
    ?? /\bfrom (\d{1,2}):(\d{2}) to (\d{1,2}):(\d{2})\b/i.exec(text);
  if (!m) return null;
  let minutes: number;
  if (m.length >= 5 && m[3] && /^\d+$/.test(m[3]) && m[4] && !/^\d+$/.test(m[4])) {
    const n = Number(m[3]);
    minutes = /^h/i.test(m[4]) ? n * 60 : n;
  } else if (m.length === 5 && /^\d+$/.test(m[1]) && /^\d+$/.test(m[3])) {
    const start = Number(m[1]) * 60 + Number(m[2]);
    let end = Number(m[3]) * 60 + Number(m[4]);
    if (end < start) end += 24 * 60;
    minutes = end - start;
  } else {
    const n = Number(m[1]);
    minutes = Number.isFinite(n) ? n : 0;
  }
  if (!minutes || minutes <= 0 || minutes > 24 * 60) return null;
  return { value: String(minutes), minutes, phrase: sentenceAround(text, m.index), confidence: 0.8 };
}

const COMPLICATION_PATTERNS: [ComplicationCategory, RegExp][] = [
  ['ORGAN_INJURY', /\b(enterotomy|(rectal|serosal|bowel|bladder|ureter(al|ic)|urethral|vascular|arterial|venous|splenic|hepatic|nerve|vessel|diaphragm(atic)?) injur(y|ies)|injury to the)\b/i],
  ['BLEEDING', /\b(estimated blood loss of (\d{3,}|[1-9]\d{3,})|massive (hemorrhage|haemorrhage|bleeding)|transfus(ed|ion) (of )?\d+ units?)\b/i],
  ['CONVERSION', /\bconver(ted|sion) to (an )?open\b/i],
];

export function deriveComplication(text: string): { category: ComplicationCategory; outcome: OutcomeCategory; phrase: string | null } {
  const explicitNone = /\b(no (intraoperative )?complications?|uncomplicated|tolerated the procedure well)\b/i.test(text);
  for (const [cat, re] of COMPLICATION_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      return { category: cat, outcome: cat === 'CONVERSION' ? 'MINOR_COMPLICATION' : 'MAJOR_COMPLICATION', phrase: sentenceAround(text, m.index) };
    }
  }
  return { category: 'NONE', outcome: explicitNone ? 'UNCOMPLICATED' : 'UNKNOWN', phrase: null };
}

// ── The whole thing ────────────────────────────────────────────────────────

export function deriveCaseFromNote(text: string, specialtyHint?: string | null): DerivedCase {
  const warnings: string[] = [];
  const t = text ?? '';
  if (t.trim().split(/\s+/).length < 40) warnings.push('The note is very short; most fields could not be derived.');

  const procedure = deriveProcedure(t, specialtyHint) ?? (specialtyHint ? deriveProcedure(t, null) : null);
  if (!procedure) warnings.push('No procedure from the Hippo library was recognized; pick it by hand.');

  const approach = deriveApproach(t);
  if (!approach) warnings.push('Approach not stated (open, laparoscopic, robotic, endoscopic, percutaneous).');

  const a = deriveAutonomy(t);
  if (!a.autonomy) warnings.push('No sentence says who performed the operation; autonomy left blank.');
  if (a.contradictory) warnings.push('The note contains both independent and assistant language; check the autonomy level.');

  const attendingLabel = deriveAttending(t);
  const operativeDurationMinutes = deriveDuration(t);
  const comp = deriveComplication(t);
  const conversionOccurred = deriveConversion(t);

  return {
    procedure,
    approach,
    autonomyLevel: a.autonomy,
    role: a.role,
    attendingLabel,
    operativeDurationMinutes,
    conversionOccurred,
    complicationCategory: comp.category,
    outcomeCategory: comp.outcome,
    suggestedEntrustment: a.entrustment,
    warnings,
  };
}

/** Flatten a DerivedCase into the shape the case form accepts as prefill. */
export function toCasePrefill(d: DerivedCase) {
  return {
    procedureName: d.procedure?.value ?? '',
    procedureDefinitionId: d.procedure?.procedureId ?? undefined,
    procedureCategory: d.procedure?.category ?? undefined,
    specialtyId: d.procedure?.specialty ?? undefined,
    surgicalApproach: d.approach?.value ?? 'OTHER',
    role: d.role?.value ?? 'PRIMARY',
    autonomyLevel: d.autonomyLevel?.value ?? 'SUPERVISOR_PRESENT',
    attendingLabel: d.attendingLabel?.value ?? undefined,
    operativeDurationMinutes: d.operativeDurationMinutes?.minutes ?? undefined,
    conversionOccurred: d.conversionOccurred,
    complicationCategory: d.complicationCategory,
    outcomeCategory: d.outcomeCategory,
  };
}
