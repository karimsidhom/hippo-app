// ---------------------------------------------------------------------------
// Procedure-template registry
//
// Templates are registered by importing their per-specialty modules below
// (urology/index.ts etc.). Each module pushes its templates onto the
// `_REGISTRY` array via `registerTemplates()`. Lookup walks the registry
// and picks the first template whose `matchPatterns` regex matches the
// CaseLog's procedureName (lowercased).
//
// Order matters: more-specific templates must be registered before their
// less-specific siblings. The registration order is enforced by the spec
// modules themselves (see urology/index.ts for the ordering rationale).
// ---------------------------------------------------------------------------

import type {
  ProcedureTemplate,
  TemplateMatchResult,
  TemplateGap,
} from "./types";

const _REGISTRY: ProcedureTemplate[] = [];
const _GAPS_OBSERVED: TemplateGap[] = [];

export function registerTemplates(templates: ProcedureTemplate[]): void {
  for (const t of templates) {
    _REGISTRY.push(t);
  }
}

export function getAllTemplates(): readonly ProcedureTemplate[] {
  return _REGISTRY;
}

/**
 * Find the first template whose pattern matches the procedure name. Returns
 * null when no template matches — callers should fall back to the prose
 * builder + log a TemplateGap for review.
 */
export function findTemplate(
  procedureName: string,
): TemplateMatchResult | null {
  if (!procedureName) return null;
  const name = procedureName.toLowerCase().trim();
  if (!name) return null;
  for (const t of _REGISTRY) {
    for (const pattern of t.matchPatterns) {
      if (pattern.test(name)) {
        return { template: t, confidence: 1 };
      }
    }
    // Fuzzier check on declared synonyms, lower confidence.
    if (t.synonyms?.some((s) => name.includes(s.toLowerCase()))) {
      return { template: t, confidence: 0.7 };
    }
  }
  return null;
}

/**
 * Record that we encountered a procedure with no rich template so
 * the team can review and add one. Stored in-memory; the build pipeline
 * exposes a getter for telemetry endpoints.
 */
export function logTemplateGap(gap: TemplateGap): void {
  _GAPS_OBSERVED.push(gap);
  // eslint-disable-next-line no-console
  console.warn(`[dictation] missing rich template: ${gap.procedureName} (${gap.specialty}) — ${gap.reason}`);
}

export function drainTemplateGaps(): TemplateGap[] {
  const gaps = _GAPS_OBSERVED.slice();
  _GAPS_OBSERVED.length = 0;
  return gaps;
}
