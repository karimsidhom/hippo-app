import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const ObservationCreateSchema = z.object({
  caseLogId:        z.string().nullable().optional(),
  epaId:            z.string().min(1),
  epaTitle:         z.string().min(1),
  specialtySlug:    z.string().min(1),
  trainingSystem:   z.string().min(1),
  observationDate:  z.string().or(z.date()),
  setting:          z.string().nullable().optional(),
  complexity:       z.string().nullable().optional(),
  technique:        z.string().nullable().optional(),
  assessorName:     z.string().min(1),
  assessorRole:     z.string().nullable().optional(),
  assessorEmail:    z.string().email().nullable().optional(),
  achievement:      z.enum(['NOT_ACHIEVED', 'ACHIEVED']).default('NOT_ACHIEVED'),
  entrustmentScore: z.number().int().min(1).max(5).nullable().optional(),
  canmedsRatings:   z.array(z.object({
    roleId:    z.string(),
    roleTitle: z.string(),
    rating:    z.number().int().min(1).max(5).nullable(),
  })).nullable().optional(),
  observationNotes: z.string().nullable().optional(),
  strengthsNotes:   z.string().nullable().optional(),
  improvementNotes: z.string().nullable().optional(),
  criteriaRatings:  z.array(z.object({
    criterionId:       z.string(),
    label:             z.string(),
    entrustmentRating: z.number().int().min(0).max(5).nullable(),
    comment:           z.string().optional(),
  })).nullable().optional(),
  safetyConcern:          z.boolean().optional(),
  professionalismConcern: z.boolean().optional(),
  concernDetails:         z.string().nullable().optional(),
});

/**
 * GET /api/epa/observations
 * Returns all EPA observations for the authenticated user.
 * Query params: epaId, status, caseLogId
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const epaId = searchParams.get('epaId');
    const status = searchParams.get('status');
    const caseLogId = searchParams.get('caseLogId');

    const where: Record<string, unknown> = { userId: user.id };
    if (epaId) where.epaId = epaId;
    if (status) where.status = status;
    if (caseLogId) where.caseLogId = caseLogId;

    const observations = await db.epaObservation.findMany({
      where,
      include: {
        caseLog: {
          select: {
            id: true,
            procedureName: true,
            caseDate: true,
            surgicalApproach: true,
          },
        },
      },
      orderBy: { observationDate: 'desc' },
    });

    return NextResponse.json(observations);
  } catch (err) {
    console.error('[GET /api/epa/observations]', err);
    return NextResponse.json({ error: 'Failed to fetch observations' }, { status: 500 });
  }
}

/**
 * POST /api/epa/observations
 * Creates a new EPA observation for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const data = ObservationCreateSchema.parse(body);

    const created = await db.epaObservation.create({
      data: {
        userId:           user.id,
        caseLogId:        data.caseLogId ?? null,
        epaId:            data.epaId,
        epaTitle:         data.epaTitle,
        specialtySlug:    data.specialtySlug,
        trainingSystem:   data.trainingSystem,
        observationDate:  new Date(data.observationDate),
        setting:          data.setting ?? null,
        complexity:       data.complexity ?? null,
        technique:        data.technique ?? null,
        assessorName:     data.assessorName,
        assessorRole:     data.assessorRole ?? null,
        assessorEmail:    data.assessorEmail ?? null,
        achievement:      data.achievement as never,
        entrustmentScore: data.entrustmentScore ?? null,
        canmedsRatings:   data.canmedsRatings ?? undefined,
        observationNotes: data.observationNotes ?? null,
        strengthsNotes:   data.strengthsNotes ?? null,
        improvementNotes: data.improvementNotes ?? null,
        criteriaRatings:  data.criteriaRatings ?? undefined,
        safetyConcern:          data.safetyConcern ?? false,
        professionalismConcern: data.professionalismConcern ?? false,
        concernDetails:         data.concernDetails ?? null,
        status:           'DRAFT',
      },
    });

    void logAudit({
      userId: user.id,
      action: 'epa.create',
      entityType: 'EpaObservation',
      entityId: created.id,
      after: created,
      metadata: { epaId: created.epaId, caseLogId: created.caseLogId },
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
    console.error('[POST /api/epa/observations]', err);
    return NextResponse.json({ error: 'Failed to create observation' }, { status: 500 });
  }
}
