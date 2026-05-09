// ---------------------------------------------------------------------------
// Custom-form schema types.
//
// Hippo's EPA + O-SCORE primitives cover RCPSC's canonical assessment
// vocabulary, but every programme has its own forms — Mini-CEX,
// DOPS, MSF, longitudinal coaching, in-training exam scoresheets,
// professionalism rubrics. This module defines the field types we
// support so program owners can design those forms in the UI without
// running a migration each time.
//
// Schemas are stored as Prisma JSON on FormTemplate.schema. Validate
// at every read/write boundary with `parseFormSchema()` so the
// application layer never sees a malformed shape.
// ---------------------------------------------------------------------------

export type FormFieldType =
  | "short_text"     // single-line free text
  | "long_text"      // multi-line free text
  | "number"         // integer or decimal
  | "boolean"        // yes/no toggle
  | "single_choice"  // radio group; pick exactly one option
  | "multi_choice"   // checkbox group; pick zero or more
  | "likert"         // 1..N scale; canonical 1-5 entrustment scale
  | "rubric_grid"    // M rows × N columns; pick one column per row
  | "signature";     // attestation row at the bottom of a form

export interface BaseField {
  id: string;        // stable identifier; mirrored on FormResponse.fieldId
  label: string;
  description?: string;
  required?: boolean;
  /**
   * Optional weight in the aggregate score. Numeric / likert /
   * single_choice / rubric_grid fields with `weight > 0` contribute
   * to the rubric total. Default 1.
   */
  weight?: number;
}

export interface ShortTextField extends BaseField {
  type: "short_text";
  placeholder?: string;
  maxLength?: number;
}

export interface LongTextField extends BaseField {
  type: "long_text";
  placeholder?: string;
  maxLength?: number;
}

export interface NumberField extends BaseField {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanField extends BaseField {
  type: "boolean";
}

export interface ChoiceOption {
  /** Stable id used as the value. */
  id: string;
  label: string;
  /** Numeric weight in the aggregate score (0 if omitted). */
  score?: number;
}

export interface SingleChoiceField extends BaseField {
  type: "single_choice";
  options: ChoiceOption[];
}

export interface MultiChoiceField extends BaseField {
  type: "multi_choice";
  options: ChoiceOption[];
}

export interface LikertField extends BaseField {
  type: "likert";
  /** Number of points on the scale; default 5. */
  scale?: number;
  /** Optional anchor labels — first ↔ last. */
  minLabel?: string;
  maxLabel?: string;
}

export interface RubricRow {
  id: string;
  label: string;
}
export interface RubricColumn {
  id: string;
  label: string;
  /** Score for this column. */
  score: number;
}
export interface RubricGridField extends BaseField {
  type: "rubric_grid";
  rows: RubricRow[];
  columns: RubricColumn[];
}

export interface SignatureField extends BaseField {
  type: "signature";
  /** Visible text placed above the signature line. */
  attestation?: string;
}

export type FormField =
  | ShortTextField
  | LongTextField
  | NumberField
  | BooleanField
  | SingleChoiceField
  | MultiChoiceField
  | LikertField
  | RubricGridField
  | SignatureField;

export interface FormSection {
  /** Stable id for the section. */
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  version: 1;
  /** Optional intro shown above the first section. */
  intro?: string;
  sections: FormSection[];
  /**
   * If set, the renderer expresses the aggregate score as a percent
   * of this maximum. When omitted the maximum is computed from the
   * field weights.
   */
  scoreOutOf?: number;
}

// ─── Response value types ───────────────────────────────────────────

export type FieldValue =
  | string                                  // short_text / long_text
  | number                                  // number / likert / single_choice (when option.score)
  | boolean                                 // boolean
  | string[]                                // multi_choice (option ids)
  | { rowId: string; columnId: string }[]   // rubric_grid (one entry per row)
  | { signedAt: string; signedBy: string }; // signature

// ─── Validation ─────────────────────────────────────────────────────

export function parseFormSchema(input: unknown): FormSchema {
  if (!input || typeof input !== "object") {
    throw new Error("FormSchema: not an object");
  }
  const schema = input as Partial<FormSchema>;
  if (schema.version !== 1) {
    throw new Error("FormSchema: unsupported version (only v1 is recognised)");
  }
  if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
    throw new Error("FormSchema: at least one section required");
  }
  const seen = new Set<string>();
  for (const section of schema.sections) {
    if (!section || typeof section !== "object") {
      throw new Error("FormSchema: section is not an object");
    }
    if (!section.id || typeof section.id !== "string") {
      throw new Error("FormSchema: section missing id");
    }
    if (!Array.isArray(section.fields)) {
      throw new Error(`FormSchema: section ${section.id} has no fields array`);
    }
    for (const field of section.fields) {
      if (!field || typeof field !== "object") {
        throw new Error("FormSchema: field is not an object");
      }
      if (!field.id || typeof field.id !== "string") {
        throw new Error("FormSchema: field missing id");
      }
      if (seen.has(field.id)) {
        throw new Error(`FormSchema: duplicate field id ${field.id}`);
      }
      seen.add(field.id);
    }
  }
  return schema as FormSchema;
}

// ─── Aggregate scoring ──────────────────────────────────────────────

export interface ScoringResult {
  total: number;
  maxPossible: number;
  /** total / maxPossible × 100, or null if maxPossible === 0. */
  percent: number | null;
}

/**
 * Compute the aggregate score for a submission given the form schema
 * and the populated responses (fieldId → value). Used at submission
 * save-time to populate FormSubmission.aggregateScore.
 */
export function scoreSubmission(
  schema: FormSchema,
  responses: Record<string, FieldValue>,
): ScoringResult {
  let total = 0;
  let maxPossible = 0;

  for (const section of schema.sections) {
    for (const field of section.fields) {
      const weight = field.weight ?? 1;
      const value = responses[field.id];
      switch (field.type) {
        case "number": {
          const max = typeof field.max === "number" ? field.max : 100;
          maxPossible += max * weight;
          if (typeof value === "number") total += value * weight;
          break;
        }
        case "likert": {
          const scale = field.scale ?? 5;
          maxPossible += scale * weight;
          if (typeof value === "number") total += value * weight;
          break;
        }
        case "single_choice": {
          const maxScore = Math.max(0, ...field.options.map((o) => o.score ?? 0));
          maxPossible += maxScore * weight;
          if (typeof value === "string") {
            const opt = field.options.find((o) => o.id === value);
            if (opt && typeof opt.score === "number") {
              total += opt.score * weight;
            }
          }
          break;
        }
        case "multi_choice": {
          // Multi-choice contributes the SUM of all option scores; the
          // max is the sum of every option's score.
          const optMax = field.options.reduce((s, o) => s + (o.score ?? 0), 0);
          maxPossible += optMax * weight;
          if (Array.isArray(value)) {
            for (const v of value) {
              const opt = field.options.find((o) => o.id === v);
              if (opt && typeof opt.score === "number") {
                total += opt.score * weight;
              }
            }
          }
          break;
        }
        case "rubric_grid": {
          const colMax = Math.max(0, ...field.columns.map((c) => c.score));
          maxPossible += colMax * field.rows.length * weight;
          if (Array.isArray(value)) {
            for (const row of value as { rowId: string; columnId: string }[]) {
              const col = field.columns.find((c) => c.id === row.columnId);
              if (col) total += col.score * weight;
            }
          }
          break;
        }
        // short_text / long_text / boolean / signature don't contribute.
        default:
          break;
      }
    }
  }

  const percent = maxPossible > 0 ? (total / maxPossible) * 100 : null;
  return { total, maxPossible, percent };
}
