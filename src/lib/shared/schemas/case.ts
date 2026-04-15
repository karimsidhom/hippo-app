import { z } from "zod";

/**
 * Canonical shape of a case-log create request. Imported by BOTH:
 *   - `src/app/api/cases/route.ts` (server validation)
 *   - `mobile/src/app/(app)/log.tsx` (client-side pre-flight)
 *
 * Changing this file changes the contract for both platforms at once.
 * Keep fields permissive (`nullable().optional()`) where the server
 * can tolerate missing input and fill a default — that way older
 * mobile builds don't break when we add new optional fields.
 */
export const CaseCreateSchema = z.object({
  specialtyId: z.string().nullable().optional(),
  specialtyName: z.string().nullable().optional(),
  procedureDefinitionId: z.string().nullable().optional(),
  procedureName: z.string().min(1),
  procedureCategory: z.string().nullable().optional(),
  surgicalApproach: z.string().default("LAPAROSCOPIC"),
  role: z.string().min(1),
  autonomyLevel: z.string().default("SUPERVISOR_PRESENT"),
  difficultyScore: z.number().int().min(1).max(5).default(3),
  operativeDurationMinutes: z.number().int().positive().nullable().optional(),
  consoleTimeMinutes: z.number().int().positive().nullable().optional(),
  dockingTimeMinutes: z.number().int().positive().nullable().optional(),
  attendingLabel: z.string().nullable().optional(),
  institutionSite: z.string().nullable().optional(),
  patientAgeBin: z.string().default("UNKNOWN"),
  diagnosisCategory: z.string().nullable().optional(),
  outcomeCategory: z.string().default("UNCOMPLICATED"),
  complicationCategory: z.string().default("NONE"),
  conversionOccurred: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  reflection: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  benchmarkOptIn: z.boolean().default(true),
  caseDate: z.string().or(z.date()),
});

export type CaseCreateInput = z.input<typeof CaseCreateSchema>;
export type CaseCreateData = z.output<typeof CaseCreateSchema>;
