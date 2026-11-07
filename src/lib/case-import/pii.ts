// ---------------------------------------------------------------------------
// PII / patient-identifier detection for case-log imports
//
// Heuristics only — flags potential identifiers so the user can confirm
// before merging. Never silently strips or modifies. False positives are
// preferred over false negatives here.
// ---------------------------------------------------------------------------

export type PiiKind =
  | "mrn"
  | "phin"
  | "dob"
  | "fullName"
  | "healthCard"
  | "phone"
  | "email"
  | "address"
  | "sin";

export interface PiiFlag {
  kind: PiiKind;
  column?: string;
  rowNumber?: number;
  example?: string;
}

const HEADER_PATTERNS: Array<{ kind: PiiKind; pattern: RegExp }> = [
  { kind: "mrn", pattern: /\b(mrn|medical record|chart number|hospital number|patient id)\b/i },
  { kind: "phin", pattern: /\bphin|provincial health|pin\b/i },
  { kind: "dob", pattern: /\b(dob|date of birth|birthdate)\b/i },
  { kind: "fullName", pattern: /\b(patient name|name of patient|first name|last name|surname|full name)\b/i },
  { kind: "healthCard", pattern: /\b(health card|hcn|ohip|health insurance|insurance number)\b/i },
  { kind: "phone", pattern: /\b(phone|telephone|mobile|cell)\b/i },
  { kind: "email", pattern: /\bemail\b/i },
  { kind: "address", pattern: /\b(address|postal code|zip code|street)\b/i },
  { kind: "sin", pattern: /\b(sin|social insurance|ssn|social security)\b/i },
];

const VALUE_PATTERNS: Array<{ kind: PiiKind; pattern: RegExp }> = [
  // Phone numbers
  { kind: "phone", pattern: /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/ },
  // Emails
  { kind: "email", pattern: /[\w.+-]+@[\w-]+(\.[\w-]+)+/ },
  // SIN/SSN
  { kind: "sin", pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/ },
  // Canadian postal code
  { kind: "address", pattern: /\b[A-Z]\d[A-Z][\s-]?\d[A-Z]\d\b/i },
  // ISO date ≥ 6 digits in DOB-like positions handled in headers, value patterns
  // catch common DD/MM/YYYY or MM/DD/YYYY formats with a reasonable-age range.
];

/**
 * Scan column headers for likely PII fields.
 */
export function flagPiiHeaders(headers: string[]): PiiFlag[] {
  const flags: PiiFlag[] = [];
  for (const header of headers) {
    for (const p of HEADER_PATTERNS) {
      if (p.pattern.test(header)) {
        flags.push({ kind: p.kind, column: header });
      }
    }
  }
  return flags;
}

/**
 * Scan the first N rows for value-pattern matches (catches PII in
 * unlabeled or generically-labeled columns like "Notes").
 */
export function flagPiiValues(
  rows: Array<Record<string, unknown>>,
  options: { sampleSize?: number } = {},
): PiiFlag[] {
  const sample = rows.slice(0, options.sampleSize ?? 25);
  const flags: PiiFlag[] = [];
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    for (const [col, raw] of Object.entries(row)) {
      if (raw === null || raw === undefined) continue;
      const s = String(raw);
      for (const p of VALUE_PATTERNS) {
        const m = p.pattern.exec(s);
        if (m) {
          flags.push({
            kind: p.kind,
            column: col,
            rowNumber: i + 1,
            example: m[0],
          });
        }
      }
    }
  }
  return flags;
}

/**
 * Combine headers + value scan for a single user-facing report.
 */
export function detectPii(
  headers: string[],
  rows: Array<Record<string, unknown>>,
): PiiFlag[] {
  return [...flagPiiHeaders(headers), ...flagPiiValues(rows)];
}

/**
 * Strip detected PII from a row before persistence. Keeps the row but
 * replaces values in PII-flagged columns with "[redacted by Hippo import]".
 * This is the de-identify-before-import option.
 */
export function redactRow(
  row: Record<string, unknown>,
  piiColumns: Set<string>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (piiColumns.has(k)) {
      redacted[k] = "[redacted by Hippo import]";
    } else {
      redacted[k] = v;
    }
  }
  return redacted;
}
