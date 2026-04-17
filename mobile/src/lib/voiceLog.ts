/**
 * Voice log API client — converts a raw dictation transcript into
 * structured case-log fields via the /api/voice-log endpoint.
 *
 * The server runs the transcript through Claude Opus 4.6 (see
 * src/lib/voice-log/parse.ts on the web). We just hand it the string
 * and zod-validate the response so the mobile UI can trust the shape.
 *
 * This is the ONLY network call in the voice flow. Speech recognition
 * itself happens on-device (see lib/voice.ts); only the text transcript
 * leaves the phone, never the audio.
 */

import { z } from 'zod';
import { apiRequest } from './api';
import {
  AUTONOMY_LEVELS,
  OUTCOME_CATEGORIES,
  SURGICAL_APPROACHES,
  type AutonomyLevel,
  type OutcomeCategory,
  type SurgicalApproach,
} from '@hippo/shared/enums';

// ── Response shape ──────────────────────────────────────────────────────
// Mirrors ParsedCaseFields from src/lib/voice-log/parse.ts. All fields
// optional — the parser omits anything the resident didn't mention. We
// use passthrough() so any new fields the server adds don't fail parse.

const ParsedCaseFieldsSchema = z
  .object({
    procedureName: z.string().optional(),
    surgicalApproach: z.string().optional(),
    role: z.string().optional(),
    autonomyLevel: z.string().optional(),
    attendingLabel: z.string().optional(),
    operativeDurationMinutes: z.number().optional(),
    outcomeCategory: z.string().optional(),
    complicationCategory: z.string().optional(),
    notes: z.string().optional(),
    reflection: z.string().optional(),
    caseDate: z.string().optional(),
  })
  .passthrough();

export const VoiceLogResponseSchema = z.object({
  fields: ParsedCaseFieldsSchema,
  engine: z.union([z.literal('claude-opus-4-6'), z.literal('unavailable')]),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }).optional(),
  warnings: z.array(z.string()).optional(),
});

export type VoiceLogResponse = z.infer<typeof VoiceLogResponseSchema>;
export type ParsedCaseFields = z.infer<typeof ParsedCaseFieldsSchema>;

export async function parseVoiceTranscript(transcript: string): Promise<VoiceLogResponse> {
  return apiRequest({
    path: '/api/voice-log',
    method: 'POST',
    body: { transcript },
    schema: VoiceLogResponseSchema,
  });
}

// ── Enum coercion helpers ───────────────────────────────────────────────
// The LLM returns uppercase enum values, but it sometimes drifts —
// "LAP", "lap", "Lap", etc. These narrow the string to a valid enum
// or null, so the form can safely consume them.

export function coerceApproach(v?: string): SurgicalApproach | undefined {
  if (!v) return undefined;
  const upper = v.toUpperCase().replace(/\s+/g, '_');
  return SURGICAL_APPROACHES.find((a) => a === upper);
}

export function coerceAutonomy(v?: string): AutonomyLevel | undefined {
  if (!v) return undefined;
  const upper = v.toUpperCase().replace(/\s+/g, '_');
  return AUTONOMY_LEVELS.find((a) => a === upper);
}

export function coerceOutcome(v?: string): OutcomeCategory | undefined {
  if (!v) return undefined;
  const upper = v.toUpperCase().replace(/\s+/g, '_');
  return OUTCOME_CATEGORIES.find((o) => o === upper);
}
