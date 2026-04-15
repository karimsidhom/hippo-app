import { z } from "zod";

/**
 * Request body for `POST /api/epa/ai-suggest`. Accepts either a saved
 * caseLogId (preferred — used when the case was persisted) OR inline
 * caseDetails (fallback — used during the optimistic-save window and
 * when the save itself failed). Without the inline fallback, a flaky
 * network shows an empty EPA sheet instead of usable suggestions.
 */
export const AiSuggestSchema = z
  .object({
    caseLogId: z.string().min(1).optional(),
    caseDetails: z
      .object({
        procedureName: z.string().min(1),
        procedureCategory: z.string().nullable().optional(),
        surgicalApproach: z.string().nullable().optional(),
        role: z.string().nullable().optional(),
        autonomyLevel: z.string().nullable().optional(),
        difficultyScore: z.number().nullable().optional(),
        diagnosisCategory: z.string().nullable().optional(),
        attendingLabel: z.string().nullable().optional(),
        outcomeCategory: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        specialtyId: z.string().nullable().optional(),
      })
      .optional(),
  })
  .refine((d) => d.caseLogId || d.caseDetails, {
    message: "Either caseLogId or caseDetails must be provided",
  });

export type AiSuggestInput = z.infer<typeof AiSuggestSchema>;

/**
 * One EPA suggestion as returned by `/api/epa/ai-suggest`. Validated
 * on the client so we don't render garbage when Gemini misbehaves.
 */
export const EpaSuggestionSchema = z.object({
  epaId: z.string(),
  epaTitle: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  score: z.number(),
  matchReasons: z.array(z.string()),
  currentProgress: z.object({
    observations: z.number(),
    targetCount: z.number(),
  }),
});
export type EpaSuggestion = z.infer<typeof EpaSuggestionSchema>;

export const AiSuggestResponseSchema = z.object({
  suggestions: z.array(EpaSuggestionSchema),
  note: z.string().optional(),
});
export type AiSuggestResponse = z.infer<typeof AiSuggestResponseSchema>;
