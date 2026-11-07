// ---------------------------------------------------------------------------
// Procedure-Specific Dictation Template registry — entry point
//
// Importing this module triggers registration of every per-specialty
// template into the central registry. Lookup is O(N) per generation, but
// N is small enough (a few hundred templates) that this is well within
// budget. Order matters: more-specific templates sit earlier in their
// specialty list and win the match race.
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";
import { registerTemplates } from "./registry";

// Specialty bundles
import { UROLOGY_TEMPLATES } from "./urology";
import { GENERAL_SURGERY_TEMPLATES } from "./generalSurgery";
import { ORTHOPEDICS_TEMPLATES } from "./orthopedics";
import { OBGYN_TEMPLATES } from "./obgyn";
import { VASCULAR_TEMPLATES } from "./vascular";
import { ENT_TEMPLATES } from "./ent";
import { NEUROSURGERY_TEMPLATES } from "./neurosurgery";
import { CARDIOTHORACIC_TEMPLATES } from "./cardiothoracic";
import { PLASTICS_TEMPLATES } from "./plastics";
import { PEDIATRIC_TEMPLATES } from "./pediatricSurgery";

const ALL_TEMPLATES: ProcedureTemplate[] = [
  ...UROLOGY_TEMPLATES,
  ...GENERAL_SURGERY_TEMPLATES,
  ...ORTHOPEDICS_TEMPLATES,
  ...OBGYN_TEMPLATES,
  ...VASCULAR_TEMPLATES,
  ...ENT_TEMPLATES,
  ...NEUROSURGERY_TEMPLATES,
  ...CARDIOTHORACIC_TEMPLATES,
  ...PLASTICS_TEMPLATES,
  ...PEDIATRIC_TEMPLATES,
];

// Idempotent registration — re-evaluating this module on hot-reload should
// not produce duplicates. The registry's array push is wrapped behind a
// guard.
let _registered = false;
export function ensureTemplatesRegistered(): void {
  if (_registered) return;
  registerTemplates(ALL_TEMPLATES);
  _registered = true;
}

// Auto-register at module load.
ensureTemplatesRegistered();

// Re-export the public surface so consumers can do
//   import { findTemplate, renderTemplate } from "@/lib/dictation/templates";
export { findTemplate, getAllTemplates, logTemplateGap, drainTemplateGaps } from "./registry";
export { renderTemplate, scoreGenericness } from "./render";
export type { ProcedureTemplate, TemplateMatchResult, TemplateGap } from "./types";
