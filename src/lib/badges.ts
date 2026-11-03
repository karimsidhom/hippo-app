/* ═══════════════════════════════════════════════════════════════════════════
   BADGE PRESENTATION
   ───────────────────────────────────────────────────────────────────────────
   Milestones are stored as machine keys (`total_25`, `streak_7`, `proc_…`).
   Two things went wrong in the UI before this module existed:

     1. Any key missing from BADGE_KEYS fell through to rendering the RAW key,
        so residents saw chips reading "independent_10" and "proc_ureteroscopy".
     2. Every badge carried an emoji, which is the single loudest tell that a
        screen was generated rather than designed.

   So: a humanising fallback, and a tone instead of a glyph. Tone maps to the
   token palette — accent for everything, and the amber signal reserved for
   the three-figure thresholds that actually deserve a different weight.
   ═══════════════════════════════════════════════════════════════════════════ */

import { BADGE_KEYS } from '@/lib/constants';

export type BadgeTone = 'accent' | 'gold' | 'success';

/** Sentence-case a snake_case key: `independent_10` → "Independent 10". */
function humanise(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, ch => ch.toUpperCase());
}

/**
 * Readable label for a badge key. Falls back through the known families
 * before resorting to humanising the raw key — a resident should never see
 * `proc_ureteroscopy` on their dashboard.
 */
export function badgeLabel(key: string, procedureName?: string | null): string {
  const known = BADGE_KEYS[key];
  if (known) return known.label;

  const total = /^total_(\d+)$/.exec(key);
  if (total) return `${total[1]} total cases`;

  const streak = /^streak_(\d+)$/.exec(key);
  if (streak) return `${streak[1]}-day streak`;

  const independent = /^independent_(\d+)$/.exec(key);
  if (independent) {
    return independent[1] === '1'
      ? 'First independent case'
      : `${independent[1]} independent cases`;
  }

  if (key === 'first_independent') return 'First independent case';
  if (key === 'first_teaching')    return 'First case as teacher';

  const proc = /^proc_(.+?)(?:_(\d+))?$/.exec(key);
  if (proc) {
    const name = procedureName ?? humanise(proc[1]);
    return proc[2] ? `${proc[2]} × ${name}` : name;
  }

  // Per-procedure keys written without the proc_ prefix:
  // `ureteroscopy_with_laser_lithotripsy_1` → "First ureteroscopy with laser lithotripsy".
  const counted = /^([a-z][a-z0-9_]*?)_(\d+)$/.exec(key);
  if (counted) {
    const name = procedureName ?? humanise(counted[1]);
    return counted[2] === '1' ? `First ${name.charAt(0).toLowerCase()}${name.slice(1)}` : `${counted[2]} × ${name}`;
  }

  return humanise(key);
}

/**
 * Which token family paints the badge. Single accent by default; the amber
 * signal is earned, not decorative.
 */
export function badgeTone(key: string, value?: number): BadgeTone {
  if (/independent|teaching/.test(key)) return 'success';
  const n = value ?? Number(/_(\d+)$/.exec(key)?.[1] ?? 0);
  if (n >= 100) return 'gold';
  return 'accent';
}

export const TONE_VAR: Record<BadgeTone, string> = {
  accent:  'var(--primary)',
  gold:    'var(--warning)',
  success: 'var(--success)',
};
