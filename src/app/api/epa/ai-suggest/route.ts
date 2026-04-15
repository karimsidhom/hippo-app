import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getSpecialtyEpaData } from '@/lib/epa/data';
import { suggestEpasForCase } from '@/lib/epa/suggest';

// Accepts EITHER a saved caseLogId (preferred, used when case was already
// persisted) OR inline case details (fallback, used during the brief window
// between an optimistic client-side save and the server round-trip, or when
// the save itself failed). Without this, a flaky network or a trainee with
// no profile.specialty would see the EPA sheet silently render empty — which
// is exactly the bug the user hit before this change.
const AiSuggestSchema = z.object({
  caseLogId: z.string().min(1).optional(),
  caseDetails: z.object({
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
  }).optional(),
}).refine((d) => d.caseLogId || d.caseDetails, {
  message: "Either caseLogId or caseDetails must be provided",
});

interface GeminiSuggestion {
  epaId: string;
  epaTitle: string;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  matchReasons: string[];
}

interface EpaSuggestion extends GeminiSuggestion {
  currentProgress: { observations: number; targetCount: number };
}

/**
 * POST /api/epa/ai-suggest
 * Uses Google Gemini 2.5 Flash to analyze a logged surgical case
 * and suggest which EPAs it best fits.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = AiSuggestSchema.parse(body);

    // Resolve a "caseLike" object from either the saved row or inline details.
    // We never throw on a missing caseLog — we just degrade gracefully.
    let caseLike: {
      procedureName: string;
      procedureCategory: string | null;
      surgicalApproach: string | null;
      role: string | null;
      autonomyLevel: string | null;
      difficultyScore: number | null;
      diagnosisCategory: string | null;
      attendingLabel: string | null;
      outcomeCategory: string | null;
      notes: string | null;
      specialtyId: string | null;
    } | null = null;

    if (parsed.caseLogId) {
      const caseLog = await db.caseLog.findFirst({
        where: { id: parsed.caseLogId, userId: user.id },
      });
      if (caseLog) {
        caseLike = {
          procedureName: caseLog.procedureName,
          procedureCategory: caseLog.procedureCategory,
          surgicalApproach: caseLog.surgicalApproach as unknown as string,
          role: caseLog.role,
          autonomyLevel: caseLog.autonomyLevel as unknown as string,
          difficultyScore: caseLog.difficultyScore,
          diagnosisCategory: caseLog.diagnosisCategory,
          attendingLabel: caseLog.attendingLabel,
          outcomeCategory: caseLog.outcomeCategory as unknown as string,
          notes: caseLog.notes,
          specialtyId: caseLog.specialtyId,
        };
      }
    }

    if (!caseLike && parsed.caseDetails) {
      caseLike = {
        procedureName: parsed.caseDetails.procedureName,
        procedureCategory: parsed.caseDetails.procedureCategory ?? null,
        surgicalApproach: parsed.caseDetails.surgicalApproach ?? null,
        role: parsed.caseDetails.role ?? null,
        autonomyLevel: parsed.caseDetails.autonomyLevel ?? null,
        difficultyScore: parsed.caseDetails.difficultyScore ?? null,
        diagnosisCategory: parsed.caseDetails.diagnosisCategory ?? null,
        attendingLabel: parsed.caseDetails.attendingLabel ?? null,
        outcomeCategory: parsed.caseDetails.outcomeCategory ?? null,
        notes: parsed.caseDetails.notes ?? null,
        specialtyId: parsed.caseDetails.specialtyId ?? null,
      };
    }

    if (!caseLike) {
      return NextResponse.json({
        suggestions: [],
        note: "We couldn't read this case yet — try again in a moment, or open the case to link an EPA manually.",
      });
    }

    // Get the user's profile for specialty and training country
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    // Use profile specialty, or fall back to the case's specialty slug.
    // If neither exists, we still return 200 with a helpful note so the
    // sheet can render a useful empty state instead of a red banner.
    const specialty = profile?.specialty || caseLike.specialtyId || '';
    if (!specialty) {
      return NextResponse.json({
        suggestions: [],
        note: "Set your specialty in Profile to see EPA suggestions.",
      });
    }

    // Load EPA data for the user's specialty
    const trainingCountry = profile?.trainingCountry ?? undefined;
    const epaData = getSpecialtyEpaData(specialty, trainingCountry);

    if (!epaData) {
      return NextResponse.json({
        suggestions: [],
        note: `No EPA framework available for ${specialty} yet.`,
      });
    }

    // Count existing observations per EPA for this user
    const specialtySlug = specialty.toLowerCase();
    const existingObs = await db.epaObservation.groupBy({
      by: ['epaId'],
      where: { userId: user.id, specialtySlug },
      _count: { epaId: true },
    });

    const observationCounts: Record<string, number> = {};
    for (const row of existingObs) {
      observationCounts[row.epaId] = row._count.epaId;
    }

    // Build EPA reference data for the prompt
    const epaReference = epaData.epas.map((epa) => ({
      id: epa.id,
      title: epa.title,
      description: epa.description,
      relatedProcedures: epa.relatedProcedures,
      currentObservations: observationCounts[epa.id] ?? 0,
      targetCount: epa.targetCaseCount,
    }));

    // Build the prompt
    const prompt = `You are a surgical education expert helping a ${specialty} resident track their Entrustable Professional Activities (EPAs).

Given the following surgical case details, determine which EPAs from the resident's specialty best match this case.

CASE DETAILS:
- Procedure Name: ${caseLike.procedureName}
- Procedure Category: ${caseLike.procedureCategory ?? 'N/A'}
- Surgical Approach: ${caseLike.surgicalApproach ?? 'N/A'}
- Role: ${caseLike.role ?? 'N/A'}
- Autonomy Level: ${caseLike.autonomyLevel ?? 'N/A'}
- Difficulty Score: ${caseLike.difficultyScore ?? 'N/A'}
- Diagnosis Category: ${caseLike.diagnosisCategory ?? 'N/A'}
- Attending: ${caseLike.attendingLabel ?? 'N/A'}
- Outcome: ${caseLike.outcomeCategory ?? 'N/A'}
- Notes: ${caseLike.notes ?? 'N/A'}

AVAILABLE EPAs FOR ${specialty.toUpperCase()} (${epaData.system} system):
${JSON.stringify(epaReference, null, 2)}

INSTRUCTIONS:
1. Select the top 3-5 EPAs that best match this surgical case.
2. For each selected EPA, explain why it matches and rate your confidence.
3. The score should be 0-100 indicating match strength.
4. Prioritize EPAs where the resident has fewer observations relative to the target (gap analysis).
5. Consider the procedure name, approach, role, autonomy level, and diagnosis when matching.

Respond ONLY with valid JSON (no markdown, no code fences, no extra text), in this exact format:
{
  "suggestions": [
    {
      "epaId": "F1",
      "epaTitle": "...",
      "confidence": "high",
      "score": 85,
      "matchReasons": ["reason 1", "reason 2"]
    }
  ]
}`;

    // Call Gemini 2.5 Flash API. If the key is missing we skip directly to
    // the deterministic fallback — this is important in local/dev and in
    // preview deployments where GOOGLE_AI_API_KEY may not be configured.
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    let suggestions: EpaSuggestion[] = [];
    let aiNote: string | undefined;

    if (!apiKey) {
      try {
        const fallback = suggestEpasForCase(caseLike as never, epaData, observationCounts);
        suggestions = fallback.map((s) => ({
          ...s,
          matchReasons: [...s.matchReasons, "(matched by keyword scoring)"],
        }));
        aiNote = "AI suggestions disabled — showing keyword-based matches.";
      } catch (fallbackErr) {
        console.error('[ai-suggest] Scoring fallback failed:', fallbackErr);
        suggestions = [];
        aiNote = "Suggestion engine is temporarily unavailable.";
      }
      return NextResponse.json({ suggestions, ...(aiNote ? { note: aiNote } : {}) });
    }

    try {
      // Try models in order with fallbacks for availability/rate limits
      const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
      let geminiData: Record<string, unknown> | null = null;

      for (const model of models) {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          },
        );

        if (geminiRes.ok) {
          geminiData = await geminiRes.json();
          console.log(`[ai-suggest] Success with model: ${model}`);
          break;
        }

        const errText = await geminiRes.text();
        console.error(`[ai-suggest] ${model} error:`, geminiRes.status, errText);

        // Only retry on 503 (overloaded) or 429 (rate limit)
        if (geminiRes.status !== 503 && geminiRes.status !== 429) {
          throw new Error(`Gemini API returned ${geminiRes.status}`);
        }
      }

      if (!geminiData) {
        throw new Error('All Gemini models unavailable');
      }

      // Extract the text content from Gemini's response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gd = geminiData as any;
      const rawText: string | undefined =
        gd?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No text in Gemini response');
      }

      // Strip markdown code fences if Gemini included them despite instructions
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned) as {
        suggestions: GeminiSuggestion[];
      };

      if (!Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid suggestions format from Gemini');
      }

      // Build a lookup for EPA target counts
      const epaTargetMap: Record<string, number> = {};
      for (const epa of epaData.epas) {
        epaTargetMap[epa.id] = epa.targetCaseCount;
      }

      // Merge in currentProgress data
      suggestions = parsed.suggestions.map((s) => ({
        epaId: s.epaId,
        epaTitle: s.epaTitle,
        confidence: s.confidence,
        score: s.score,
        matchReasons: s.matchReasons,
        currentProgress: {
          observations: observationCounts[s.epaId] ?? 0,
          targetCount: epaTargetMap[s.epaId] ?? 0,
        },
      }));
    } catch (aiErr) {
      console.error('[ai-suggest] Gemini call failed, falling back to scoring engine:', aiErr);

      // Fallback: use the deterministic scoring engine
      try {
        const fallbackSuggestions = suggestEpasForCase(
          caseLike as never,
          epaData,
          observationCounts,
        );
        suggestions = fallbackSuggestions.map((s) => ({
          ...s,
          matchReasons: [...s.matchReasons, '(AI unavailable — matched by keyword scoring)'],
        }));
        aiNote = 'AI suggestion engine is temporarily unavailable. Showing keyword-based matches.';
      } catch (fallbackErr) {
        console.error('[ai-suggest] Scoring fallback also failed:', fallbackErr);
        suggestions = [];
        aiNote = 'Suggestion engine is temporarily unavailable. Please try again later.';
      }
    }

    return NextResponse.json({
      suggestions,
      ...(aiNote ? { note: aiNote } : {}),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[POST /api/epa/ai-suggest]', err);
    return NextResponse.json({ error: 'Failed to generate AI suggestions' }, { status: 500 });
  }
}
