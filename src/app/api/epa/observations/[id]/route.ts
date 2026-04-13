import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

const ObservationUpdateSchema = z.object({
  caseLogId:        z.string().nullable().optional(),
  epaId:            z.string().min(1).optional(),
  epaTitle:         z.string().min(1).optional(),
  specialtySlug:    z.string().min(1).optional(),
  trainingSystem:   z.string().min(1).optional(),
  observationDate:  z.string().or(z.date()).optional(),
  setting:          z.string().nullable().optional(),
  complexity:       z.string().nullable().optional(),
  assessorName:     z.string().min(1).optional(),
  assessorRole:     z.string().nullable().optional(),
  assessorEmail:    z.string().email().nullable().optional(),
  achievement:      z.enum(['NOT_ACHIEVED', 'ACHIEVED']).optional(),
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
}).strict();

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/epa/observations/[id]
 * Returns a single EPA observation by id (must belong to user).
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;

    const observation = await db.epaObservation.findFirst({
      where: { id, userId: user.id },
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
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    return NextResponse.json(observation);
  } catch (err) {
    console.error('[GET /api/epa/observations/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch observation' }, { status: 500 });
  }
}

/**
 * PATCH /api/epa/observations/[id]
 * Updates an EPA observation (only if status is DRAFT or RETURNED).
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;

    const existing = await db.epaObservation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'RETURNED') {
      return NextResponse.json(
        { error: 'Can only edit observations in DRAFT or RETURNED status' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = ObservationUpdateSchema.parse(body);

    // Build update payload, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (data.caseLogId !== undefined) updateData.caseLogId = data.caseLogId;
    if (data.epaId !== undefined) updateData.epaId = data.epaId;
    if (data.epaTitle !== undefined) updateData.epaTitle = data.epaTitle;
    if (data.specialtySlug !== undefined) updateData.specialtySlug = data.specialtySlug;
    if (data.trainingSystem !== undefined) updateData.trainingSystem = data.trainingSystem;
    if (data.observationDate !== undefined) updateData.observationDate = new Date(data.observationDate);
    if (data.setting !== undefined) updateData.setting = data.setting;
    if (data.complexity !== undefined) updateData.complexity = data.complexity;
    if (data.assessorName !== undefined) updateData.assessorName = data.assessorName;
    if (data.assessorRole !== undefined) updateData.assessorRole = data.assessorRole;
    if (data.assessorEmail !== undefined) updateData.assessorEmail = data.assessorEmail;
    if (data.achievement !== undefined) updateData.achievement = data.achievement;
    if (data.entrustmentScore !== undefined) updateData.entrustmentScore = data.entrustmentScore;
    if (data.canmedsRatings !== undefined) updateData.canmedsRatings = data.canmedsRatings;
    if (data.observationNotes !== undefined) updateData.observationNotes = data.observationNotes;
    if (data.strengthsNotes !== undefined) updateData.strengthsNotes = data.strengthsNotes;
    if (data.improvementNotes !== undefined) updateData.improvementNotes = data.improvementNotes;
    if (data.criteriaRatings !== undefined) updateData.criteriaRatings = data.criteriaRatings;
    if (data.safetyConcern !== undefined) updateData.safetyConcern = data.safetyConcern;
    if (data.professionalismConcern !== undefined) updateData.professionalismConcern = data.professionalismConcern;
    if (data.concernDetails !== undefined) updateData.concernDetails = data.concernDetails;

    // If editing a RETURNED observation, reset status back to DRAFT
    if (existing.status === 'RETURNED') {
      updateData.status = 'DRAFT';
      updateData.returnedReason = null;
    }

    const updated = await db.epaObservation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[PATCH /api/epa/observations/[id]]', err);
    return NextResponse.json({ error: 'Failed to update observation' }, { status: 500 });
  }
}

/**
 * DELETE /api/epa/observations/[id]
 * Deletes an EPA observation (only if status is DRAFT).
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await context.params;

    const existing = await db.epaObservation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete observations in DRAFT status' },
        { status: 400 },
      );
    }

    await db.epaObservation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/epa/observations/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete observation' }, { status: 500 });
  }
}
