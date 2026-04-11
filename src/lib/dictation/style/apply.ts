import type { StyleProfile } from "./profile";
import type { ServiceKey } from "../types";

// ---------------------------------------------------------------------------
// Apply a style profile to rendered note text.
//
// Layered in order so earlier transforms set up the shape later ones rely on:
//   1. Section reordering + dropping (structural)
//   2. Phrase substitutions (from/to literal replacements)
//   3. Strip avoid-phrases (global + service scoped)
//   4. Brevity trimming
//   5. Header case normalization
//   6. Formatting: blank lines between sections + bullet style
//
// Everything is best-effort — if a transform can't infer structure it leaves
// the text untouched rather than mangling it.
// ---------------------------------------------------------------------------

const HEADER_RE = /^([A-Z][A-Z0-9 \-/&]{2,}):\s*$/;

interface Section {
  label: string;
  body: string[];
}

function parseSections(text: string): { preamble: string[]; sections: Section[] } {
  const lines = text.split(/\r?\n/);
  const preamble: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const m = line.match(HEADER_RE);
    if (m) {
      if (current) sections.push(current);
      current = { label: m[1].trim(), body: [] };
      continue;
    }
    if (current) current.body.push(line);
    else preamble.push(line);
  }
  if (current) sections.push(current);
  return { preamble, sections };
}

function renderSections(
  preamble: string[],
  sections: Section[],
  blankLinesBetween: number,
): string {
  const gap = "\n".repeat(Math.max(1, blankLinesBetween + 1));
  const sectionBlocks = sections.map((s) => {
    // Trim leading/trailing blanks in each section body.
    let body = s.body.slice();
    while (body.length && body[0].trim() === "") body.shift();
    while (body.length && body[body.length - 1].trim() === "") body.pop();
    return `${s.label}:\n${body.join("\n")}`;
  });
  const head = preamble.join("\n").replace(/\s+$/, "");
  return (head ? head + "\n\n" : "") + sectionBlocks.join(gap);
}

function reorderAndDrop(
  text: string,
  profile: StyleProfile["global"],
): string {
  const order = profile.sectionOrder;
  const dropped = profile.droppedSections ?? [];
  if (!order?.length && !dropped.length) return text;

  const { preamble, sections } = parseSections(text);
  if (!sections.length) return text;

  // Drop sections the user has consistently removed.
  const keep = sections.filter((s) => !dropped.includes(s.label));
  if (!keep.length) return text;

  // Reorder: sections present in `order` come first in that order; remaining
  // sections keep their relative order at the end.
  let reordered = keep;
  if (order?.length) {
    const byLabel = new Map(keep.map((s) => [s.label, s] as const));
    const ordered: Section[] = [];
    const used = new Set<string>();
    for (const label of order) {
      const s = byLabel.get(label);
      if (s) {
        ordered.push(s);
        used.add(label);
      }
    }
    for (const s of keep) {
      if (!used.has(s.label)) ordered.push(s);
    }
    reordered = ordered;
  }

  const blankLines = profile.formatting?.blankLinesBetweenSections ?? 1;
  return renderSections(preamble, reordered, blankLines);
}

function applyPhraseSubstitutions(
  text: string,
  subs: Array<{ from: string; to: string }> | undefined,
): string {
  if (!subs?.length) return text;
  let out = text;
  for (const { from, to } of subs) {
    if (!from || !to) continue;
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), to);
  }
  return out;
}

function stripPhrases(text: string, phrases: string[] | undefined): string {
  if (!phrases?.length) return text;
  let out = text;
  for (const p of phrases) {
    if (!p || p.length < 4) continue;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\s*${escaped}\\s*`, "gi");
    out = out.replace(re, " ");
  }
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
}

function normalizeHeaders(
  text: string,
  style: StyleProfile["global"]["headerStyle"],
): string {
  if (style === "upper") return text;
  if (style === "title") {
    return text.replace(/^([A-Z][A-Z \-/]+:)/gm, (m) =>
      m
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }
  if (style === "plain") {
    return text.replace(/^([A-Z][A-Z \-/]+:)/gm, (m) => m.toLowerCase());
  }
  return text;
}

function applyBrevity(
  text: string,
  brevity: StyleProfile["global"]["brevity"],
): string {
  if (brevity === "concise") {
    return text
      .replace(/\s*\[[^\]]*\]\s*/g, " ")
      .replace(/[ \t]{2,}/g, " ");
  }
  return text;
}

function applyBulletStyle(
  text: string,
  bullet: StyleProfile["global"]["formatting"] extends infer T
    ? T extends { bulletStyle?: infer B }
      ? B
      : undefined
    : undefined,
): string {
  if (bullet === undefined) return text;
  if (bullet === null) {
    // Prose preference — strip leading bullet markers.
    return text.replace(/^(\s*)[-•*]\s+/gm, "$1");
  }
  return text.replace(/^(\s*)[-•*](\s+)/gm, `$1${bullet}$2`);
}

export function applyStyleProfile(
  text: string,
  profile: StyleProfile,
  opts?: { service?: ServiceKey },
): string {
  let out = text;

  // 1. Structural
  out = reorderAndDrop(out, profile.global);

  // 2. Phrase substitutions (global)
  out = applyPhraseSubstitutions(out, profile.global.phraseSubstitutions);

  // 3. Strip avoid phrases — global + service
  out = stripPhrases(out, profile.global.avoidPhrases);
  if (opts?.service) {
    const svc = profile.services[opts.service];
    if (svc?.avoidPhrases) out = stripPhrases(out, svc.avoidPhrases);
  }

  // 4. Brevity
  out = applyBrevity(out, profile.global.brevity);

  // 5. Headers
  out = normalizeHeaders(out, profile.global.headerStyle);

  // 6. Bullet style
  out = applyBulletStyle(out, profile.global.formatting?.bulletStyle);

  return out.trim() + "\n";
}
