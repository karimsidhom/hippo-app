// ---------------------------------------------------------------------------
// Procedure-Specific Dictation Template type system
//
// The pre-template engine produced specialty-level prose ("urology
// builders") that was right kind-of-thing but not procedure-specific
// enough — a TURBT and a cystoscopy could read similarly. This system
// fixes that by making each procedure its own structured template object
// with required fields, devices, steps, specimens, drains, complications,
// and a postop plan.
//
// Rendering this template via render.ts produces a full operative note
// with sections that match the procedure's actual workflow. The renderer
// emits bracketed `[detail]` placeholders for fields the user did not
// provide, so a half-filled case still produces something useful.
// ---------------------------------------------------------------------------

import type { ServiceKey } from "../types";

/**
 * The full canonical procedure template. Every procedure registered with
 * the engine produces an instance of this shape. Use the helpers in
 * register.ts to declare templates with sensible defaults for fields the
 * procedure does not need (e.g. a vasectomy template can omit `drains`).
 */
export interface ProcedureTemplate {
  /** Stable key — `{specialty}.{subcategory}.{procedure}`. */
  key: string;
  /** Specialty service this template belongs to. */
  specialty: ServiceKey;
  /** Optional sub-grouping (e.g. "endourology", "oncology", "bph"). */
  subcategory?: string;
  /** Display name as it would appear at the top of the dictation. */
  procedureName: string;
  /** Synonyms / alternate spellings — used for matching CaseLog.procedureName. */
  synonyms?: string[];
  /** Regex patterns the procedure name must match for this template to win. */
  matchPatterns: RegExp[];

  /** Default top-of-note answers (anesthesia / EBL / drains / etc.). */
  topMatter: TemplateTopMatter;

  /** Procedure-specific findings prompts (substantive — never generic). */
  findings: FindingsPrompts;

  /** Numbered operative steps — the actual sequence the procedure follows. */
  operativeSteps: OperativeSteps;

  /** Devices, instruments, implants relevant to this procedure. */
  devices: DeviceList;

  /** Typical specimen handling. */
  specimens: SpecimenSpec;

  /** Drains / catheters / stents / packing / dressings. */
  tubesAndDrains: DrainSpec;

  /** Complications to actively rule in/out and document for this procedure. */
  complicationChecks: ComplicationCheck[];

  /** Realistic postoperative plan defaults. */
  postopPlan: PostopPlan;

  /** Required clinical fields the dictation needs before it's complete. */
  requiredFields: ClinicalField[];

  /** Optional clinical fields that improve the dictation if present. */
  optionalFields?: ClinicalField[];

  /** Billing / documentation prompts surfaced when billing support is on. */
  billingPrompts?: string[];

  /** Optional notes about which CaseLog roles / variants this template covers. */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Section payload types
// ---------------------------------------------------------------------------

export interface TemplateTopMatter {
  anesthesia: string;
  position?: string;
  prep?: string;
  ebl?: string;
  /** Default disposition narrative. Interpolated by the renderer. */
  disposition: string;
}

export interface FindingsPrompts {
  /** Headline finding template — e.g. "Right testis torsed approximately {{torsion}} degrees." */
  headline: string;
  /** Supporting clauses each on its own line/sentence. */
  supporting?: string[];
}

export interface OperativeSteps {
  /** Procedure-specific numbered steps. Each step is a complete clause. */
  steps: string[];
  /** Closure / wound-care narrative that always appears at the end. */
  closure?: string;
  /** Optional setup paragraph (positioning, prep, time-out) — the renderer
   * can prepend a generic universal setup when this is empty. */
  setup?: string;
}

export interface DeviceList {
  /** Hardware (scope, laser, stapler, retractor) used in this procedure. */
  instruments: string[];
  /** Implants left in the patient (stent, mesh, prosthesis, valve). */
  implants?: string[];
  /** Consumables (sutures, contrast, energy device cartridges). */
  consumables?: string[];
}

export interface SpecimenSpec {
  /** Default text — e.g. "None.", "Tumor chips for permanent pathology." */
  default: string;
  /** Conditional alternates based on case data (e.g. orchiectomy specimen). */
  alternates?: Array<{
    /** Predicate against the procedure name. */
    when: RegExp;
    text: string;
  }>;
}

export interface DrainSpec {
  /** Default drains/tubes — "None." or descriptive list. */
  default: string;
  /** Conditional alternates. */
  alternates?: Array<{
    when: RegExp;
    text: string;
  }>;
}

export interface ComplicationCheck {
  /** Short label — "Bladder perforation", "Stent migration", etc. */
  label: string;
  /** Default state if no complication occurred — usually "None." */
  defaultStatus?: string;
}

export interface PostopPlan {
  /** Disposition (PACU / floor / ICU / discharge home). */
  disposition: string;
  /** Catheter / drain plan. */
  catheter?: string;
  /** Pain management. */
  analgesia?: string;
  /** Antibiotics. */
  antibiotics?: string;
  /** Activity restrictions. */
  activity?: string;
  /** Diet plan. */
  diet?: string;
  /** Follow-up specifics — labs, imaging, clinic visits. */
  followup: string[];
  /** Return precautions. */
  returnPrecautions?: string[];
}

export interface ClinicalField {
  /** Internal id — used for storage / export. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Field type. */
  type: "text" | "number" | "boolean" | "enum" | "laterality";
  /** Enum options when type === "enum". */
  options?: string[];
  /** Optional hint / description. */
  hint?: string;
}

// ---------------------------------------------------------------------------
// Match result + lookup result types
// ---------------------------------------------------------------------------

export interface TemplateMatchResult {
  template: ProcedureTemplate;
  /** How confident the matcher is (0–1) — used to log "needs expansion". */
  confidence: number;
}

/**
 * The "this procedure is missing a rich template" log entry. Logged
 * client-side via console.warn AND queued via the api/dictation/template-gap
 * endpoint so we can review what's missing in production.
 */
export interface TemplateGap {
  procedureName: string;
  specialty: ServiceKey;
  reason: string;
  observedAt: string;
}
