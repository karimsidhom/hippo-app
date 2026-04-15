/**
 * Client-side helpers for the /api/cases endpoint family. Pure
 * data-fetch; no React, no state management — callers stitch these
 * into Zustand/Context/etc.
 */

import { z } from 'zod';
import { apiRequest } from './api';
import {
  CaseCreateSchema,
  type CaseCreateInput,
} from '@hippo/shared/schemas/case';

// Shape returned from `GET /api/cases`. We keep this loose — the
// dashboard doesn't need every column, and tolerating unknown fields
// means we don't break when the schema adds columns.
const CaseLogSchema = z
  .object({
    id: z.string(),
    procedureName: z.string(),
    procedureCategory: z.string().nullable(),
    surgicalApproach: z.string().nullable(),
    role: z.string(),
    autonomyLevel: z.string().nullable(),
    difficultyScore: z.number().nullable(),
    caseDate: z.string(),
    operativeDurationMinutes: z.number().nullable(),
    attendingLabel: z.string().nullable(),
    outcomeCategory: z.string().nullable(),
    specialtyId: z.string().nullable(),
    diagnosisCategory: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .passthrough();

export type CaseLog = z.infer<typeof CaseLogSchema>;

export async function listCases(): Promise<CaseLog[]> {
  return apiRequest({
    path: '/api/cases',
    method: 'GET',
    schema: z.array(CaseLogSchema),
  });
}

/**
 * Validate client-side with the shared schema before hitting the
 * server. Catches bad input (missing procedureName, etc.) without a
 * round-trip and produces the same error shape the server would.
 */
export async function createCase(input: CaseCreateInput): Promise<CaseLog> {
  const body = CaseCreateSchema.parse(input);
  return apiRequest({
    path: '/api/cases',
    method: 'POST',
    body,
    schema: CaseLogSchema,
  });
}
