/**
 * The rule-based suggester (lib/epa/suggest.ts) explains its score in
 * scoring terms ("Gap priority (+12 pts)"). A resident choosing an EPA needs
 * the why in plain words, and the progress bar on each card already shows
 * how many observations are done, so the gap line is dropped. Reasons that
 * do not match a known rule (the model's own wording) pass through.
 */
export function readableReason(reason: string): string | null {
  const text = reason.trim();
  if (!text) return null;
  let m: RegExpMatchArray | null;
  if ((m = text.match(/^Exact procedure match: "(.+)"$/))) return `Same procedure: ${m[1]}`;
  if ((m = text.match(/^Substring procedure match: "(.+)"$/))) return `Matches “${m[1]}”`;
  if ((m = text.match(/^Partial word overlap with: "(.+)" \(\d+ words?\)$/))) return `Similar to “${m[1]}”`;
  if (/^Category alignment\b/.test(text)) return "Same area of practice";
  if (/^Autonomy-stage alignment\b/.test(text)) return "Fits your autonomy level";
  if ((m = text.match(/^Approach relevance: EPA references (\w+) approach$/))) {
    return `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)} approach`;
  }
  if (/^Gap priority\b/.test(text)) return null;
  return text;
}

export function readableReasons(reasons: readonly string[]): string[] {
  const out: string[] = [];
  for (const reason of reasons) {
    const line = readableReason(reason);
    if (line && !out.includes(line)) out.push(line);
  }
  return out;
}
