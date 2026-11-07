export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Inclusive containment match — returns true if any needle appears in the
 * lowercased haystack. Used for procedure-name routing.
 */
export function includesAny(haystack: string, needles: string[]): boolean {
  const s = haystack.toLowerCase();
  return needles.some((n) => s.includes(n));
}

/**
 * Return "a" or "an" for the given word based on its first letter.
 * Used so procedure names read naturally in indications lines.
 */
export function article(word: string): string {
  const first = word.trim().toLowerCase()[0] ?? "";
  return "aeiou".includes(first) ? "an" : "a";
}
