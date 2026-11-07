import type { NoteType, ServiceKey } from "../types";
import type { StyleProfile, ServiceStyle } from "./profile";
import { mergeStyleProfile, getStyleProfile } from "./store";

// ---------------------------------------------------------------------------
// Learn style preferences from a corrected dictation.
//
// The user's corrections are treated as training data. From a draft/corrected
// pair we extract five orthogonal signals:
//
//   1. Structural preference  — which labeled sections appear, and in what
//      order. Sections that the user consistently removed go into
//      droppedSections; remaining sections define sectionOrder.
//
//   2. Preferred phrasing     — sentence-level additions become
//      preferredPhrases. Sentence pairs with high lexical overlap but
//      different wording become phraseSubstitutions ({from, to}).
//
//   3. Brevity                — ratio of corrected length to draft length.
//      <0.8 → concise, >1.2 → verbose, else standard. Requires a couple of
//      corrections to settle (weighted by correctionCount).
//
//   4. Service-specific wording — phrases are also written into the
//      service-scoped bucket so urology-specific pearls don't pollute the
//      global profile.
//
//   5. Formatting preferences — blank-line counts between sections, bullet
//      style, whether headers live on their own line.
//
// Each call is idempotent and merges into the persisted profile.
// ---------------------------------------------------------------------------

interface LearnInput {
  noteType: NoteType;
  service: ServiceKey;
  draft: string;
  corrected: string;
  saveAsExample?: boolean;
}

// ---------- helpers ---------------------------------------------------------

const HEADER_RE = /^([A-Z][A-Z0-9 \-/&]{2,}):\s*$/;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z\[])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Extract labeled section headers in the order they appear. */
function extractSectionOrder(text: string): string[] {
  const seen: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(HEADER_RE);
    if (m) {
      const label = m[1].trim();
      if (!seen.includes(label)) seen.push(label);
    }
  }
  return seen;
}

/** Count blank lines between section headers to infer spacing preference. */
function inferBlankLinesBetweenSections(text: string): number | undefined {
  const lines = text.split(/\r?\n/);
  const counts: number[] = [];
  let lastHeaderIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (HEADER_RE.test(lines[i])) {
      if (lastHeaderIdx >= 0) {
        let blanks = 0;
        for (let j = i - 1; j > lastHeaderIdx; j--) {
          if (lines[j].trim() === "") blanks++;
          else break;
        }
        counts.push(blanks);
      }
      lastHeaderIdx = i;
    }
  }
  if (!counts.length) return undefined;
  // median
  counts.sort((a, b) => a - b);
  return counts[Math.floor(counts.length / 2)];
}

/** Detect bullet usage in the corrected text. */
function inferBulletStyle(text: string): "-" | "•" | "*" | null | undefined {
  const lines = text.split(/\r?\n/).map((l) => l.trimStart());
  let dash = 0;
  let bullet = 0;
  let star = 0;
  let prose = 0;
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("- ")) dash++;
    else if (line.startsWith("• ")) bullet++;
    else if (line.startsWith("* ")) star++;
    else prose++;
  }
  const totalBullets = dash + bullet + star;
  if (totalBullets === 0 && prose > 4) return null; // prose-preferred
  if (totalBullets === 0) return undefined;
  if (dash >= bullet && dash >= star) return "-";
  if (bullet >= star) return "•";
  return "*";
}

/** Cheap Jaccard similarity over word sets. */
function jaccard(a: string, b: string): number {
  const sa = new Set(normalize(a).split(" "));
  const sb = new Set(normalize(b).split(" "));
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

/**
 * Given draft sentences that were removed and corrected sentences that were
 * added, pair them up when they clearly describe the same fact with different
 * wording — that becomes a phrase substitution.
 */
function extractSubstitutions(
  removed: string[],
  added: string[],
): Array<{ from: string; to: string }> {
  const subs: Array<{ from: string; to: string }> = [];
  const usedAdded = new Set<number>();
  for (const from of removed) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < added.length; i++) {
      if (usedAdded.has(i)) continue;
      const score = jaccard(from, added[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    // Require real overlap but not identity — that's a genuine rewording.
    if (bestIdx >= 0 && bestScore >= 0.35 && bestScore < 0.95) {
      usedAdded.add(bestIdx);
      subs.push({ from: from.trim(), to: added[bestIdx].trim() });
    }
  }
  return subs.slice(0, 30);
}

/** Brevity ratio → label with hysteresis. */
function inferBrevity(
  draft: string,
  corrected: string,
): StyleProfile["global"]["brevity"] | undefined {
  const dLen = draft.replace(/\s+/g, " ").length;
  const cLen = corrected.replace(/\s+/g, " ").length;
  if (dLen === 0) return undefined;
  const ratio = cLen / dLen;
  if (ratio < 0.8) return "concise";
  if (ratio > 1.2) return "verbose";
  return "standard";
}

// ---------- main -----------------------------------------------------------

export function learnFromCorrection(input: LearnInput): StyleProfile {
  const current = getStyleProfile();
  const draftSentences = splitSentences(input.draft);
  const correctedSentences = splitSentences(input.corrected);

  const draftSet = new Set(draftSentences.map(normalize));
  const correctedSet = new Set(correctedSentences.map(normalize));

  const removed = draftSentences.filter((s) => !correctedSet.has(normalize(s)));
  const added = correctedSentences.filter((s) => !draftSet.has(normalize(s)));

  // 1. Structural preference --------------------------------------------------
  const draftHeaders = extractSectionOrder(input.draft);
  const correctedHeaders = extractSectionOrder(input.corrected);
  const droppedSections = draftHeaders.filter(
    (h) => !correctedHeaders.includes(h),
  );
  const sectionOrder = correctedHeaders.length ? correctedHeaders : undefined;

  // 2. Preferred phrasing -----------------------------------------------------
  const tooSpecific = (s: string) => s.length > 200;
  const preferredPhrases = added
    .filter((s) => !tooSpecific(s) && s.length > 6)
    .slice(0, 25);
  const avoidPhrases = removed
    .filter((s) => !tooSpecific(s) && s.length > 6)
    .slice(0, 25);
  const phraseSubstitutions = extractSubstitutions(removed, added);

  // 3. Brevity ----------------------------------------------------------------
  const brevity = inferBrevity(input.draft, input.corrected) ?? current.global.brevity;

  // 5. Formatting -------------------------------------------------------------
  const blankLinesBetweenSections = inferBlankLinesBetweenSections(input.corrected);
  const bulletStyle = inferBulletStyle(input.corrected);

  // Merge global phrase buckets with the existing profile — dedupe and cap.
  const mergedPreferred = dedupe([
    ...preferredPhrases,
    ...current.global.preferredPhrases,
  ]).slice(0, 100);
  const mergedAvoid = dedupe([
    ...avoidPhrases,
    ...current.global.avoidPhrases,
  ]).slice(0, 100);
  const mergedSubs = dedupeSubs([
    ...phraseSubstitutions,
    ...(current.global.phraseSubstitutions ?? []),
  ]).slice(0, 100);
  const mergedDropped = dedupe([
    ...droppedSections,
    ...(current.global.droppedSections ?? []),
  ]);

  // 4. Service-specific wording ----------------------------------------------
  const existingServiceStyle: ServiceStyle = current.services[input.service] ?? {};
  const serviceStyle: ServiceStyle = {
    preferredPhrases: dedupe([
      ...preferredPhrases,
      ...(existingServiceStyle.preferredPhrases ?? []),
    ]).slice(0, 60),
    avoidPhrases: dedupe([
      ...avoidPhrases,
      ...(existingServiceStyle.avoidPhrases ?? []),
    ]).slice(0, 60),
    procedurePearls: existingServiceStyle.procedurePearls,
  };

  const patch: Parameters<typeof mergeStyleProfile>[0] = {
    global: {
      brevity,
      headerStyle: current.global.headerStyle,
      sectionOrder,
      droppedSections: mergedDropped,
      preferredPhrases: mergedPreferred,
      avoidPhrases: mergedAvoid,
      phraseSubstitutions: mergedSubs,
      formatting: {
        ...(current.global.formatting ?? {}),
        ...(blankLinesBetweenSections !== undefined
          ? { blankLinesBetweenSections }
          : {}),
        ...(bulletStyle !== undefined ? { bulletStyle } : {}),
      },
      correctionCount: (current.global.correctionCount ?? 0) + 1,
    },
    services: {
      [input.service]: serviceStyle,
    },
  };

  if (input.saveAsExample) {
    patch.examples = [
      {
        noteType: input.noteType,
        service: input.service,
        excerpt: input.corrected.slice(0, 1200),
        savedAt: new Date().toISOString(),
      },
    ];
  }

  return mergeStyleProfile(patch);
}

/** Convenience wrapper used by UI components. */
export function applyUserCorrection(input: LearnInput): StyleProfile {
  return learnFromCorrection({ ...input, saveAsExample: true });
}

// ---------- tiny utils -----------------------------------------------------

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const key = normalize(s);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function dedupeSubs(
  arr: Array<{ from: string; to: string }>,
): Array<{ from: string; to: string }> {
  const seen = new Set<string>();
  const out: Array<{ from: string; to: string }> = [];
  for (const s of arr) {
    const key = `${normalize(s.from)}→${normalize(s.to)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
