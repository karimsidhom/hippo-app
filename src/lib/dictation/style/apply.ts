import type { StyleProfile } from "./profile";

// ---------------------------------------------------------------------------
// Apply a style profile to rendered note text.
//
// Current scope (first landing):
// - strip phrases listed in `avoidPhrases` (with surrounding whitespace)
// - apply brevity trimming when "concise"
// - normalize header case per headerStyle
//
// Deliberately kept simple. More advanced transformations (section reordering,
// preferred-phrase substitution) will layer on once we have real correction
// data to learn from.
// ---------------------------------------------------------------------------

function stripPhrases(text: string, phrases: string[]): string {
  let out = text;
  for (const p of phrases) {
    if (!p) continue;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\s*${escaped}\\s*`, "gi");
    out = out.replace(re, " ");
  }
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
}

function normalizeHeaders(text: string, style: StyleProfile["global"]["headerStyle"]): string {
  if (style === "upper") return text; // current renderers already use upper section labels
  if (style === "title") {
    return text.replace(/^([A-Z][A-Z \-/]+:)/gm, (m) =>
      m
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/:/g, ":"),
    );
  }
  if (style === "plain") {
    return text.replace(/^([A-Z][A-Z \-/]+:)/gm, (m) => m.toLowerCase());
  }
  return text;
}

function applyBrevity(text: string, brevity: StyleProfile["global"]["brevity"]): string {
  if (brevity !== "concise") return text;
  // In concise mode, collapse bracketed optional/placeholder phrases.
  return text.replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/[ \t]{2,}/g, " ");
}

export function applyStyleProfile(text: string, profile: StyleProfile): string {
  let out = text;
  out = stripPhrases(out, profile.global.avoidPhrases);
  out = applyBrevity(out, profile.global.brevity);
  out = normalizeHeaders(out, profile.global.headerStyle);
  return out.trim() + "\n";
}
