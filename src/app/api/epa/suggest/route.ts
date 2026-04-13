import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { suggestEpasForCase } from '@/lib/epa/suggest';
import { getSpecialtyEpaData } from '@/lib/epa/data';

const SuggestSchema = z.object({
  caseLogId: z.string().min(1),
});

/**
 * POST /api/epa/suggest
 * Given a caseLogId, returns EPA suggestions based on the case details
 * and the user's specialty/training data.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { caseLogId } = SuggestSchema.parse(body);

    // Fetch the case log (must belong to user)
    const caseLog = await db.caseLog.findFirst({
      where: { id: caseLogId, userId: user.id },
    });

    if (!caseLog) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get the user's profile for specialty and training country
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile?.specialty) {
      return NextResponse.json(
        { error: 'Profile specialty not set. Please complete onboarding first.' },
        { status: 400 },
      );
    }

    // Load EPA data for the user's specialty
    const epaData = getSpecialtyEpaData(profile.specialty, profile.trainingCountry ?? undefined);

    if (!epaData) {
      return NextResponse.json(
        { error: 'No EPA data available for your specialty' },
        { status: 404 },
      );
    }

    // Count existing observations per EPA to feed into gap scoring
    // Use lowercased specialty to match the slug stored on observations
    const specialtySlug = profile.specialty.toLowerCase();
    const existingObs = await db.epaObservation.groupBy({
      by: ['epaId'],
      where: { userId: user.id, specialtySlug },
      _count: { epaId: true },
    });

    const observationCounts: Record<string, number> = {};
    for (const row of existingObs) {
      observationCounts[row.epaId] = row._count.epaId;
    }

    // Generate suggestions
    const suggestions = suggestEpasForCase(
      caseLog as never,
      epaData,
      observationCounts,
    );

    return NextResponse.json({ suggestions });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[POST /api/epa/suggest]', err);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
