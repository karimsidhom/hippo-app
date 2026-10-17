/**
 * Hippo Link: the shared whitelist for cross-app handoffs (Phase 2).
 *
 * Copied byte-identical into each repo that sends or receives handoffs
 * (Handover and Cases), checked with shasum; the tests live in Handover at
 * tests/hub-link.test.ts. No imports, so it runs on the server, in the
 * browser, and in middleware alike.
 *
 * PHIA rule: a handoff carries only the fields its kind allows, every string
 * is stripped of identifier-shaped tokens, and the sender rejects any draft
 * that still contains the patient's name or MRN. The database repeats the
 * whitelist and the long-number rule in its own trigger (hub_handoffs_guard).
 */

export const CASE_DRAFT_ROLES = ["First Surgeon", "Assist", "Observer"] as const;
export type CaseDraftRole = (typeof CASE_DRAFT_ROLES)[number];

/** Handover to Cases: what a "Log this case" handoff may carry. Nothing else. */
export interface CaseDraft {
  procedureName: string;
  /** YYYY-MM-DD, or "" when unknown. */
  caseDate: string;
  attendingLabel: string;
  institutionSite: string;
  diagnosisCategory: string;
  roleGuess: CaseDraftRole;
  /** Always true: Cases never saves a handoff without the user confirming it. */
  reviewBeforeSave: true;
}

export const CASE_DRAFT_FIELDS = [
  "procedureName",
  "caseDate",
  "attendingLabel",
  "institutionSite",
  "diagnosisCategory",
  "roleGuess",
  "reviewBeforeSave",
] as const satisfies readonly (keyof CaseDraft)[];

export const CASE_DRAFT_LIMITS = {
  procedureName: 200,
  attendingLabel: 80,
  institutionSite: 80,
  diagnosisCategory: 120,
} as const;

export const HUB_LINK_KINDS = {
  case_draft: { from: "handover", to: "cases", fields: CASE_DRAFT_FIELDS },
} as const;
export type HubLinkKind = keyof typeof HUB_LINK_KINDS;

export const HUB_LINK_APP_LABELS: Record<string, string> = {
  handover: "Handover",
  cases: "Cases",
  research: "Research",
  study: "Study",
};

export const HUB_LINK_CASES_ORIGIN = "https://hippomedicine.com";

/** Where a case_draft lands: the Cases log form, prefilled. */
export function caseLogDeepLink(id: string): string {
  return `${HUB_LINK_CASES_ORIGIN}/log?handoff=${encodeURIComponent(id)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(s: unknown): s is string {
  return typeof s === "string" && UUID.test(s);
}

// ---------------------------------------------------------------------------
// Identifier stripping
// ---------------------------------------------------------------------------

const EMAIL = /[^\s@()<>]+@[^\s@()<>]+\.[^\s@()<>]+/g;
// A keyword that names an identifier, plus the token after it (if any).
const ID_KEYWORD = /\b(?:MRN|PHIN|PHN|HCN|HSN|ULI|DOB|D\.O\.B)\b\.?[\s:#=.-]*(?:[A-Za-z]{0,3}\d[\d\s/.-]*)?/gi;
// Words that only name an identifier when a number follows.
const ID_PHRASE = /\b(?:chart|acct|account|record|health\s*card|date\s+of\s+birth)\s*(?:no\.?|number|num|#)?[\s:#=.-]*[A-Za-z]{0,3}\d[\d\s/.-]*/gi;
const NUMERIC_DATE = /\b\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}\b/g;
// Six or more digits, allowing single spaces, dots or dashes between them.
const DIGIT_RUN = /\d(?:[\s.-]?\d){5,}/g;
const AGE_YEARS = /\b\d{1,3}\s*-?\s*(?:years?|yrs?)(?:\s*-?\s*old)?\b(?:\s*[MF]\b)?|\b\d{1,3}\s*(?:yo|y\/o|y\.o\.?)(?:\s*[MF]\b)?/gi;
const AGE_SEX = /\b\d{1,3}\s?[MF]\b/g;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F]/g;

function tidy(s: string): string {
  return s
    .replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:.)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/([,;:])(?:\s*[,;:])+/g, "$1")
    .replace(/^[\s,;:.\-]+|[\s,;:\-]+$/g, "")
    .trim();
}

/** Remove MRN, PHIN, DOB and similar tokens, long digit runs, numeric dates, ages and emails. */
export function stripIdentifiers(text: string): string {
  if (typeof text !== "string" || !text) return "";
  const s = text
    .replace(CONTROL, " ")
    .replace(EMAIL, " ")
    .replace(ID_KEYWORD, " ")
    .replace(ID_PHRASE, " ")
    .replace(DIGIT_RUN, " ")
    .replace(NUMERIC_DATE, " ")
    .replace(AGE_YEARS, " ")
    .replace(AGE_SEX, " ");
  return tidy(s);
}

function cap(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trim() : s;
}

function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return cap(stripIdentifiers(v), max);
}

/** True for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** The one way a case_draft is shaped: whitelist, strip, cap, validate. */
export function sanitizeCaseDraft(raw: unknown): CaseDraft {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const role = CASE_DRAFT_ROLES.find((x) => x === r.roleGuess) ?? "First Surgeon";
  return {
    procedureName: cleanText(r.procedureName, CASE_DRAFT_LIMITS.procedureName),
    caseDate: isIsoDate(r.caseDate) ? r.caseDate : "",
    attendingLabel: cleanText(r.attendingLabel, CASE_DRAFT_LIMITS.attendingLabel),
    institutionSite: cleanText(r.institutionSite, CASE_DRAFT_LIMITS.institutionSite),
    diagnosisCategory: cleanText(r.diagnosisCategory, CASE_DRAFT_LIMITS.diagnosisCategory),
    roleGuess: role,
    reviewBeforeSave: true,
  };
}

// ---------------------------------------------------------------------------
// Name and MRN leak check (run by the sender before anything is stored)
// ---------------------------------------------------------------------------

const TEXT_FIELDS = ["procedureName", "attendingLabel", "institutionSite", "diagnosisCategory"] as const;
const HONORIFICS = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "jr", "sr", "the", "and"]);

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** First draft field containing the patient's name (or a name token of 3+ letters) or MRN, else null. */
export function findNameLeak(
  d: CaseDraft,
  name: string,
  mrn?: string | null,
): (typeof TEXT_FIELDS)[number] | null {
  const tokens = fold(name || "")
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 3 && !HONORIFICS.has(t));
  const mrnKey = fold(mrn || "").replace(/[^a-z0-9]/g, "");
  for (const f of TEXT_FIELDS) {
    const value = fold(d[f] || "");
    if (!value) continue;
    const words = new Set(value.split(/[^a-z]+/).filter(Boolean));
    if (tokens.some((t) => words.has(t))) return f;
    if (mrnKey.length >= 4 && value.replace(/[^a-z0-9]/g, "").includes(mrnKey)) return f;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Field builders the sender uses
// ---------------------------------------------------------------------------

const SITES: [RegExp, string][] = [
  [/\bhsc\b|health\s*sciences/i, "Health Sciences Centre"],
  [/\bst\.?\s*b\b|\bsbh\b|st\.?\s*boniface/i, "St. Boniface Hospital"],
  [/\bgrace\b/i, "Grace Hospital"],
  [/\bvictoria\b/i, "Victoria General Hospital"],
  [/\bconcordia\b/i, "Concordia Hospital"],
  [/\bseven\s*oaks\b|\bsogh\b/i, "Seven Oaks General Hospital"],
  [/\bbrandon\b/i, "Brandon Regional Health Centre"],
];

/** Map a Handover team name to a site label; unknown names give "" (never the raw name). */
export function siteLabelFromTeam(teamName: string): string {
  const n = teamName || "";
  for (const [re, label] of SITES) if (re.test(n)) return label;
  return "";
}

/** A first guess only; the user always picks. */
export function roleGuessFromLevel(level: string | null | undefined): CaseDraftRole {
  return /^\s*pgy[\s-]*[12]\b/i.test(level || "") ? "Assist" : "First Surgeon";
}

/** The first clause of Handover's diagnosis (HPI) field, stripped and capped. */
export function diagnosisFromText(text: string): string {
  const first = (text || "").split(/\n|;|\.(?=\s|$)/)[0] ?? "";
  const stripped = stripIdentifiers(first).replace(/^(?:with|w\/|for|and)\s+/i, "");
  return cap(tidy(stripped), CASE_DRAFT_LIMITS.diagnosisCategory);
}

// ---------------------------------------------------------------------------
// Procedure matching (the receiver uses it to prefill its picker)
// ---------------------------------------------------------------------------

const SHORTHAND: Record<string, string[]> = {
  lap: ["laparoscopic"],
  lsc: ["laparoscopic"],
  robot: ["robotic"],
  cysto: ["cystoscopy"],
  nx: ["nephrectomy"],
  bx: ["biopsy"],
  perc: ["percutaneous"],
  urs: ["ureteroscopy"],
};
const DROP = new Set([
  "of", "the", "with", "and", "for", "a", "an", "to", "in", "on", "under", "via", "plus",
  "left", "right", "l", "r", "lt", "rt", "bilateral", "bilat",
]);

function procTokens(s: string): string[] {
  const words = fold(s).replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().split(" ");
  const out: string[] = [];
  for (const w of words) {
    if (!w || DROP.has(w)) continue;
    const exp = SHORTHAND[w];
    if (exp) out.push(...exp);
    else out.push(w.replace(/^robot$/, "robotic"));
  }
  return out;
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = short === a ? b : a;
  if (short.length >= 4 && long.startsWith(short)) return true;
  if (short.length >= 5) return editDistance(a, b, long.length >= 8 ? 2 : 1) <= (long.length >= 8 ? 2 : 1);
  return false;
}

function trigrams(s: string): Set<string> {
  const p = `  ${s} `;
  const set = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3));
  return set;
}

// "Cysto + L stent" names the access, then the operation: a candidate that
// matches only the access step ("Cystoscopy") should not win.
const ACCESS = new Set(["cystoscopy"]);
// A candidate's action ("stent removal") counts against it when the text never said it.
const ACTIONS = new Set([
  "removal", "exchange", "insertion", "placement", "replacement", "revision", "repair",
  "reversal", "implantation", "explantation", "change",
]);

function similarity(raw: string[], cand: string[]): number {
  if (!raw.length || !cand.length) return 0;
  if (raw.join(" ") === cand.join(" ")) return 1;
  const used = new Set<number>();
  const hits: string[] = [];
  for (const t of raw) {
    const j = cand.findIndex((c, i) => !used.has(i) && tokenMatch(t, c));
    if (j >= 0) {
      used.add(j);
      hits.push(t);
    }
  }
  const dice = (2 * hits.length) / (raw.length + cand.length);
  const a = trigrams(raw.join(" "));
  const b = trigrams(cand.join(" "));
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  const tri = inter / (a.size + b.size - inter);
  const unsaidActions = cand.filter((c, i) => !used.has(i) && ACTIONS.has(c)).length;
  const score = 0.8 * dice + 0.2 * tri - 0.1 * unsaidActions;
  const onlyAccess = hits.length > 0 && hits.every((t) => ACCESS.has(t)) && raw.some((t) => !ACCESS.has(t));
  return onlyAccess ? score * 0.5 : score;
}

export const PROCEDURE_MATCH_THRESHOLD = 0.35;

/** Best procedure for free text, scored over names and aliases; null below the threshold. */
export function matchProcedure<T extends { name: string; aliases?: readonly string[] }>(
  raw: string,
  procedures: readonly T[],
): { match: T | null; score: number; alternatives: T[] } {
  const rt = procTokens(raw || "");
  if (!rt.length) return { match: null, score: 0, alternatives: [] };
  // Also score the text without its access step, when it names something else.
  const core = rt.filter((t) => !ACCESS.has(t));
  const variants = core.length && core.length < rt.length ? [rt, core] : [rt];
  const scored = procedures.map((p, i) => {
    const names = [p.name, ...(p.aliases ?? [])].map(procTokens);
    let best = 0;
    for (const v of variants) {
      for (const n of names) {
        if (best === 1) break;
        best = Math.max(best, similarity(v, n));
      }
    }
    return { p, i, score: best };
  });
  scored.sort((x, y) => y.score - x.score || x.i - y.i);
  const top = scored[0];
  if (!top || top.score < PROCEDURE_MATCH_THRESHOLD) {
    return { match: null, score: top?.score ?? 0, alternatives: [] };
  }
  const alternatives = scored
    .slice(1)
    .filter((s) => s.score >= PROCEDURE_MATCH_THRESHOLD)
    .slice(0, 3)
    .map((s) => s.p);
  return { match: top.p, score: top.score, alternatives };
}
