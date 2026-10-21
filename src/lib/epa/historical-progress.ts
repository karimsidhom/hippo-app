import { z } from "zod";

/** Shared browser/server contract for imported summaries, never assessments. */
export const MAX_HISTORICAL_EPA_BYTES = 256 * 1024;
export const HISTORICAL_EPA_SCHEMA_VERSION = 1;
export const historicalSpecialtySchema = z.string().trim().min(1).max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a valid specialty slug.");
const code = z.string().trim().min(1).max(128)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/, "Invalid EPA or criterion identifier.");
const count = z.number().int().min(0).max(1_000_000);
const completion = z.enum(["complete", "outstanding", "in_progress", "unknown"]);
const text = z.string().max(4_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date in YYYY-MM-DD format.");

export const historicalEpaCriterionSchema = z.object({
  criterion: z.string().trim().min(1).max(1_000),
  done: count.nullable(),
  required: count,
  remaining: count.nullable(),
  completion_status: completion,
  unit: z.string().max(100),
  source_note: text.optional(),
  completion_basis: text.optional(),
  criterion_id: code.optional(),
  parent_criterion_id: code.nullable().optional(),
  parent_criterion: z.string().max(1_000).optional(),
  depth: z.number().int().min(0).max(10).optional(),
  is_total: z.boolean().optional(),
  criterion_kind: z.string().max(100).optional(),
}).passthrough();

export const historicalEpaRecordSchema = z.object({
  code,
  stage: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(1_000),
  completion_status: completion,
  completion_basis: text.optional(),
  overall_done: count.nullable(),
  overall_required: count,
  method: text.optional(),
  reviewer_notes: text.optional(),
  source_pages: z.string().max(200).optional(),
  criteria: z.array(historicalEpaCriterionSchema).min(1).max(500),
}).passthrough().superRefine((record, ctx) => {
  const ids = new Set<string>();
  for (const [index, criterion] of record.criteria.entries()) {
    if (criterion.criterion_id && ids.has(criterion.criterion_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["criteria", index, "criterion_id"], message: "Criterion identifiers must be unique within an EPA." });
    }
    if (criterion.criterion_id) ids.add(criterion.criterion_id);
    // A completed threshold may have an unknown actual count. Keep that
    // independently from completion of the entire EPA and its other criteria.
    if (criterion.done !== null && criterion.remaining !== null &&
        criterion.remaining !== Math.max(criterion.required - criterion.done, 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["criteria", index, "remaining"], message: "Remaining count does not match done and required counts." });
    }
  }
  for (const [index, criterion] of record.criteria.entries()) {
    if (criterion.parent_criterion_id && (!ids.has(criterion.parent_criterion_id) || criterion.parent_criterion_id === criterion.criterion_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["criteria", index, "parent_criterion_id"], message: "A parent criterion must reference another criterion in this EPA." });
    }
  }
});

export const historicalEpaParentSchema = z.object({
  code,
  title: z.string().trim().min(1).max(1_000),
  completion_status: completion,
  completion_basis: text.optional(),
  actual_completed_count: count.nullable(),
}).passthrough();

export const historicalEpaSnapshotSchema = z.object({
  source: z.object({
    filename: z.string().trim().min(1).max(1_000),
    review_date: date,
    committee_decision_date: date.nullable().optional(),
    pending_assessments: count.nullable().optional(),
  }).passthrough(),
  interpretation: z.object({
    unlisted_epa_status: completion.optional(),
    unlisted_criterion_status: completion.optional(),
    user_clarification: text.optional(),
  }).passthrough().default({}),
  records: z.array(historicalEpaRecordSchema).max(300),
  all_parent_epas: z.array(historicalEpaParentSchema).max(300).default([]),
}).passthrough().superRefine((snapshot, ctx) => {
  if (!snapshot.records.length && !snapshot.all_parent_epas.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["records"], message: "Include at least one EPA progress record." });
  }
  for (const field of ["records", "all_parent_epas"] as const) {
    const ids = new Set<string>();
    for (const [index, record] of snapshot[field].entries()) {
      if (ids.has(record.code)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field, index, "code"], message: "EPA identifiers must be unique." });
      ids.add(record.code);
    }
  }
});

export const historicalProgressImportSchema = z.object({
  specialty: historicalSpecialtySchema,
  snapshot: historicalEpaSnapshotSchema,
}).strict();

export type HistoricalEpaCriterion = z.infer<typeof historicalEpaCriterionSchema>;
export type HistoricalEpaRecord = z.infer<typeof historicalEpaRecordSchema>;
export type HistoricalEpaParent = z.infer<typeof historicalEpaParentSchema>;
export type HistoricalEpaSnapshot = z.infer<typeof historicalEpaSnapshotSchema>;
export type HistoricalProgressImport = z.infer<typeof historicalProgressImportSchema>;

export class HistoricalProgressInputError extends Error {
  constructor(message: string, readonly status: 400 | 413 = 400) { super(message); }
}

/** Also used for browser preview; unknown extra source fields survive intact. */
export function parseHistoricalProgressImport(input: unknown): HistoricalProgressImport {
  let encoded: string | undefined;
  try { encoded = JSON.stringify(input); } catch { throw new HistoricalProgressInputError("Use a valid JSON progress summary."); }
  if (!encoded) throw new HistoricalProgressInputError("Choose a progress summary to import.");
  if (new TextEncoder().encode(encoded).byteLength > MAX_HISTORICAL_EPA_BYTES) {
    throw new HistoricalProgressInputError("Progress summaries must be 256 KiB or smaller.", 413);
  }
  const result = historicalProgressImportSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new HistoricalProgressInputError(`Invalid progress summary (${issue.path.join(".") || "summary"}): ${issue.message}`);
  }
  return result.data;
}

/** Bound streamed bytes even when Content-Length is absent or inaccurate. */
export async function readHistoricalProgressImport(req: Pick<Request, "headers" | "body">): Promise<HistoricalProgressImport> {
  const length = Number(req.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_HISTORICAL_EPA_BYTES) {
    throw new HistoricalProgressInputError("Progress summaries must be 256 KiB or smaller.", 413);
  }
  const reader = req.body?.getReader();
  if (!reader) throw new HistoricalProgressInputError("Choose a progress summary to import.");
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HISTORICAL_EPA_BYTES) {
        await reader.cancel();
        throw new HistoricalProgressInputError("Progress summaries must be 256 KiB or smaller.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let input: unknown;
    try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new HistoricalProgressInputError("Use a valid JSON progress summary."); }
    return parseHistoricalProgressImport(input);
  } finally { reader.releaseLock(); }
}
