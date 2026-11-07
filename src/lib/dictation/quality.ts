// ---------------------------------------------------------------------------
// Dictation Quality Engine
// ---------------------------------------------------------------------------
//
// Pre-display completeness check for generated operative notes.
// Returns a quality status + the list of missing required / optional fields.
//
// Critical sections (must be present for an operative note to be billable
// and clinically defensible):
//   - Preoperative diagnosis
//   - Postoperative diagnosis
//   - Procedure performed
//   - Anesthesia
//   - Findings
//   - Description of Procedure
//   - Specimens (or "None")
//   - EBL
//   - Complications (or "None")
//   - Disposition
//
// Optional sections (nice-to-have, surface as soft prompts):
//   - Positioning
//   - Prep / drape
//   - Time-out
//   - Drains (or "None")
//   - Implants / stents / devices
//   - Postop plan
// ---------------------------------------------------------------------------

export type DictationQualityStatus =
  | "complete"
  | "missing-optional"
  | "missing-critical";

export interface DictationQualityResult {
  status: DictationQualityStatus;
  /** Human-readable list of critical sections that are missing or empty. */
  missingCritical: string[];
  /** Human-readable list of optional sections that are missing or empty. */
  missingOptional: string[];
  /** Approx word count of the body of the note (excludes headers + trailers). */
  wordCount: number;
  /** Suggested user-facing prompts to fix critical gaps. */
  prompts: string[];
}

const CRITICAL_SECTIONS: Array<{
  label: string;
  patterns: RegExp[];
  /** A section "exists" if its body has at least this many non-bracket chars. */
  minBodyChars?: number;
}> = [
  { label: "Preoperative diagnosis", patterns: [/preoperative\s+diagnosis/i] },
  { label: "Postoperative diagnosis", patterns: [/postoperative\s+diagnosis/i] },
  { label: "Procedure performed", patterns: [/procedure\s+performed/i, /^procedure:/im] },
  { label: "Anesthesia", patterns: [/^anesthesia:/im, /\banesthesia\b/i] },
  { label: "Findings", patterns: [/^findings:/im, /\bfindings\b/i], minBodyChars: 40 },
  { label: "Description of Procedure", patterns: [/description\s+of\s+procedure/i], minBodyChars: 200 },
  { label: "Specimens", patterns: [/^specimens:/im, /\bspecimens\b/i] },
  { label: "EBL", patterns: [/estimated\s+blood\s+loss/i, /\bEBL\b/] },
  { label: "Complications", patterns: [/^complications:/im, /\bcomplications\b/i] },
  { label: "Disposition", patterns: [/^disposition:/im, /\bdisposition\b/i] },
];

const OPTIONAL_SECTIONS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "Positioning", patterns: [/\bposition(ed|ing)?\b/i] },
  { label: "Prep / drape", patterns: [/\bprep(ared|ped)?\b.*\bdrape/i, /\bsterile\s+(fashion|drape)/i] },
  { label: "Time-out", patterns: [/\btime[-\s]?out\b/i] },
  { label: "Drains", patterns: [/^drains:/im, /\bdrains?\b/i] },
  { label: "Postop plan", patterns: [/\bpost-?op(erative)?\s+plan\b/i, /\bplan:/im] },
];

function findSectionPresent(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

function findSectionBody(text: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index + m[0].length;
    // Body extends until the next ALL-CAPS section header or 300 chars.
    const slice = text.slice(start, start + 600);
    const next = /\n\s*[A-Z][A-Z \-/]{4,}:/.exec(slice);
    return next ? slice.slice(0, next.index) : slice;
  }
  return "";
}

function isPlaceholderOnly(body: string): boolean {
  const stripped = body.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  return stripped.length < 6;
}

export function assessDictationQuality(text: string): DictationQualityResult {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  for (const section of CRITICAL_SECTIONS) {
    const present = findSectionPresent(text, section.patterns);
    if (!present) {
      missingCritical.push(section.label);
      continue;
    }
    if (section.minBodyChars) {
      const body = findSectionBody(text, section.patterns);
      const cleaned = body.replace(/\[[^\]]*\]/g, "").trim();
      if (cleaned.length < section.minBodyChars || isPlaceholderOnly(body)) {
        missingCritical.push(`${section.label} (too thin)`);
      }
    }
  }

  for (const section of OPTIONAL_SECTIONS) {
    if (!findSectionPresent(text, section.patterns)) {
      missingOptional.push(section.label);
    }
  }

  // Word count of "Description of Procedure" — the heart of the note.
  const dopBody = findSectionBody(text, [/description\s+of\s+procedure/i]);
  const wordCount = dopBody
    ? dopBody.split(/\s+/).filter(Boolean).length
    : text.split(/\s+/).filter(Boolean).length;

  let status: DictationQualityStatus = "complete";
  if (missingCritical.length > 0) status = "missing-critical";
  else if (missingOptional.length > 0) status = "missing-optional";

  const prompts: string[] = [];
  for (const m of missingCritical) {
    prompts.push(`${m} missing — add or confirm "None".`);
  }

  return {
    status,
    missingCritical,
    missingOptional,
    wordCount,
    prompts,
  };
}

export function qualityStatusLabel(status: DictationQualityStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "missing-optional":
      return "Missing optional details";
    case "missing-critical":
      return "Missing critical details";
  }
}

export function qualityStatusColor(status: DictationQualityStatus): string {
  switch (status) {
    case "complete":
      return "#10b981"; // emerald
    case "missing-optional":
      return "#f59e0b"; // amber
    case "missing-critical":
      return "#ef4444"; // red
  }
}
