import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const CaseCreateSchema = z.object({
  specialtyId:              z.string().nullable().optional(),
  specialtyName:            z.string().nullable().optional(),
  procedureDefinitionId:    z.string().nullable().optional(),
  procedureName:            z.string().min(1),
  procedureCategory:        z.string().nullable().optional(),
  surgicalApproach:         z.string().default('LAPAROSCOPIC'),
  role:                     z.string().min(1),
  autonomyLevel:            z.string().default('SUPERVISOR_PRESENT'),
  difficultyScore:          z.number().int().min(1).max(5).default(3),
  operativeDurationMinutes: z.number().int().positive().nullable().optional(),
  consoleTimeMinutes:       z.number().int().positive().nullable().optional(),
  dockingTimeMinutes:       z.number().int().positive().nullable().optional(),
  attendingLabel:           z.string().nullable().optional(),
  institutionSite:          z.string().nullable().optional(),
  patientAgeBin:            z.string().default('UNKNOWN'),
  diagnosisCategory:        z.string().nullable().optional(),
  outcomeCategory:          z.string().default('UNCOMPLICATED'),
  complicationCategory:     z.string().default('NONE'),
  conversionOccurred:       z.boolean().default(false),
  notes:                    z.string().nullable().optional(),
  reflection:               z.string().nullable().optional(),
  tags:                     z.array(z.string()).default([]),
  isPublic:                 z.boolean().default(false),
  benchmarkOptIn:           z.boolean().default(true),
  caseDate:                 z.string().or(z.date()),
});

/**
 * GET /api/cases
 * Returns all cases for the authenticated user, newest first.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const cases = await db.caseLog.findMany({
    where: { userId: user.id },
    orderBy: { caseDate: 'desc' },
  });

  return NextResponse.json(cases);
}

/**
 * POST /api/cases
 * Creates a new case for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = CaseCreateSchema.parse(body);

    const created = await db.caseLog.create({
      data: {
        userId:                  user.id,
        specialtyId:             data.specialtyId ?? null,
        procedureDefinitionId:   data.procedureDefinitionId ?? null,
        procedureName:           data.procedureName,
        procedureCategory:       data.procedureCategory ?? null,
        surgicalApproach:        data.surgicalApproach as never,
        role:                    data.role,
        autonomyLevel:           data.autonomyLevel as never,
        difficultyScore:         data.difficultyScore,
        operativeDurationMinutes: data.operativeDurationMinutes ?? null,
        consoleTimeMinutes:      data.consoleTimeMinutes ?? null,
        dockingTimeMinutes:      data.dockingTimeMinutes ?? null,
        attendingLabel:          data.attendingLabel ?? null,
        institutionSite:         data.institutionSite ?? null,
        patientAgeBin:           data.patientAgeBin as never,
        diagnosisCategory:       data.diagnosisCategory ?? null,
        outcomeCategory:         data.outcomeCategory as never,
        complicationCategory:    data.complicationCategory as never,
        conversionOccurred:      data.conversionOccurred,
        notes:                   data.notes ?? null,
        reflection:              data.reflection ?? null,
        tags:                    data.tags,
        isPublic:                data.isPublic,
        benchmarkOptIn:          data.benchmarkOptIn,
        caseDate:                new Date(data.caseDate),
      },
    });

    // Create a feed event if the case is public
    if (data.isPublic) {
      await db.feedEvent.create({
        data: {
          userId:      user.id,
          eventType:   'CASE_LOGGED',
          title:       `Logged ${data.procedureName}`,
          description: `${data.role} · ${data.autonomyLevel.replace(/_/g, ' ')}`,
          isPublic:    true,
          metadata:    { caseId: created.id, procedureName: data.procedureName },
        },
      }).catch(() => {}); // Non-critical — don't fail the case save
    }

    void logAudit({
      userId: user.id,
      action: 'case.create',
      entityType: 'CaseLog',
      entityId: created.id,
      after: created,
      req,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[POST /api/cases]', err);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
