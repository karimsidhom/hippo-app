import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getSpecialtyEpaData } from '@/lib/epa/data';
import type { EpaDefinition, SpecialtyEpaData } from '@/lib/epa/data';
import { suggestEpasForCase } from '@/lib/epa/suggest';
// Shared with mobile — see src/lib/shared/README.md. Changing the
// request contract here automatically flows through to the mobile
// pre-flight validator.
import { AiSuggestSchema } from '@/lib/shared/schemas/epa';

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
// This route calls Gemini, which can stall under load. Don't let Next/Vercel
// kill us at 10s — give the model room to think through a large EPA list.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // --- From here on, we NEVER return 5xx. Any unexpected error degrades to a
  //     200 with `suggestions: []` + a human-readable `note`, so the modal
  //     always shows something and the "Couldn't load EPA suggestions right
  //     now" copy never fires on the client side. The client treats non-OK
  //     responses as failure, which meant every transient hiccup blanked the
  //     sheet — that was the bug.
  try {
    const body = await req.json().catch(() => ({}));
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
    const specialty = profile?.specialty || caseLike.specialtyId || '';
    if (!specialty) {
      return NextResponse.json({
        suggestions: [],
        note: "Set your specialty in Profile to see EPA suggestions.",
      });
    }

    // Hippo is a Manitoba-based CBD app — default to "CA" when the profile
    // hasn't set a country. This ensures we load RCPSC data (which has
    // coverage for all surgical specialties) instead of falling through to
    // ACGME which only covers a few — that mismatch was the real
    // "no suggestions found" bug.
    const trainingCountry = profile?.trainingCountry || 'CA';
    const specialtyEpaData = getSpecialtyEpaData(specialty, trainingCountry);

    // For Canadian residents, ALWAYS include Surgical Foundations EPAs in
    // the suggestion pool — early-stage cases (F/D prefix) should match SF
    // regardless of the resident's chosen specialty.
    const foundationsEpaData =
      trainingCountry === 'CA'
        ? getSpecialtyEpaData('surgical-foundations', 'CA')
        : undefined;

    if (!specialtyEpaData && !foundationsEpaData) {
      return NextResponse.json({
        suggestions: [],
        note: `No EPA framework available for ${specialty} yet.`,
      });
    }

    // Merge SF + specialty EPAs into one pool so a single case can match
    // either track. De-dup by EPA id (keeps the first occurrence — SF wins
    // when there's a collision, matching the UI's toggle priority).
    const mergedEpas: EpaDefinition[] = [];
    const mergedMilestones: SpecialtyEpaData['milestones'] = [];
    const seenEpaIds = new Set<string>();
    const seenMilestoneIds = new Set<string>();

    for (const data of [foundationsEpaData, specialtyEpaData].filter(Boolean) as SpecialtyEpaData[]) {
      for (const epa of data.epas) {
        if (seenEpaIds.has(epa.id)) continue;
        seenEpaIds.add(epa.id);
        mergedEpas.push(epa);
      }
      for (const m of data.milestones) {
        if (seenMilestoneIds.has(m.id)) continue;
        seenMilestoneIds.add(m.id);
        mergedMilestones.push(m);
      }
    }

    const epaData: SpecialtyEpaData = {
      specialty: specialtyEpaData?.specialty || 'Surgical Foundations',
      system: specialtyEpaData?.system || foundationsEpaData?.system || 'RCPSC',
      epas: mergedEpas,
      milestones: mergedMilestones,
    };

    // Count existing observations per EPA for this user — scan across both
    // SF and specialty slugs so gap-priority scoring is accurate.
    const specialtySlug = specialty.toLowerCase();
    const existingObs = await db.epaObservation.groupBy({
      by: ['epaId'],
      where: {
        userId: user.id,
        specialtySlug: { in: [specialtySlug, 'surgical-foundations'] },
      },
      _count: { epaId: true },
    });

    const observationCounts: Record<string, number> = {};
    for (const row of existingObs) {
      observationCounts[row.epaId] = (observationCounts[row.epaId] ?? 0) + row._count.epaId;
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
      // NO timeouts, no token caps, no conservative models. User wants
      // Gemini unleashed to reason through the full EPA list and produce
      // the best possible match. Order is pro (best) → flash (fast) →
      // flash-lite (cheap fallback) → 1.5-flash (legacy safety net).
      // Per-model abort is gated only by the route-level maxDuration.
      const models = [
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash',
      ];
      let geminiData: Record<string, unknown> | null = null;
      let usedModel: string | null = null;
      let lastErr: string | null = null;

      console.log(
        `[ai-suggest] start user=${user.id} specialty=${specialty} ` +
          `country=${trainingCountry} epas=${epaReference.length} ` +
          `procedure="${caseLike.procedureName}"`,
      );

      for (const model of models) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: prompt }],
                  },
                ],
                // Force JSON so we don't lose suggestions to markdown
                // fences or prose preambles.
                generationConfig: {
                  temperature: 0.3,
                  // 32k is well within 2.5-pro/-flash output ceilings and
                  // guarantees a 40-EPA response never truncates.
                  maxOutputTokens: 32768,
                  responseMimeType: 'application/json',
                },
                // Disable every safety category so clinical language
                // (anatomy, bleeding, death outcomes) never triggers a
                // spurious block. Trainees log what happened; the model
                // shouldn't moralize at them.
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
              }),
            },
          );

          if (geminiRes.ok) {
            geminiData = await geminiRes.json();
            usedModel = model;
            console.log(`[ai-suggest] Success with model: ${model}`);
            break;
          }

          const errText = await geminiRes.text();
          lastErr = `${model}: ${geminiRes.status} ${errText.slice(0, 300)}`;
          console.error(`[ai-suggest] ${model} error:`, geminiRes.status, errText.slice(0, 300));
        } catch (modelErr) {
          lastErr = `${model}: ${modelErr instanceof Error ? modelErr.message : 'unknown'}`;
          console.error(`[ai-suggest] ${model} threw:`, modelErr);
        }
      }

      if (!geminiData) {
        throw new Error(`All Gemini models unavailable${lastErr ? ` (last: ${lastErr})` : ''}`);
      }

      // Extract the text content from Gemini's response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gd = geminiData as any;
      const candidate = gd?.candidates?.[0];
      const rawText: string | undefined =
        candidate?.content?.parts?.[0]?.text ??
        // With responseMimeType=application/json, some SDKs return the
        // JSON as `parts[0].inlineData.data` or the whole `text` array.
        // Handle both defensively.
        (Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts
              .map((p: { text?: string }) => p?.text ?? '')
              .filter(Boolean)
              .join('')
          : undefined);

      if (!rawText) {
        console.error('[ai-suggest] empty candidate:', {
          finishReason: candidate?.finishReason,
          safetyRatings: candidate?.safetyRatings,
          model: usedModel,
        });
        throw new Error(
          `No text in Gemini response (finishReason=${candidate?.finishReason ?? 'unknown'})`,
        );
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
      // Bad request body is the only thing we still 4xx on — this is a
      // programming error, not a runtime flake, and silently ignoring it
      // would hide real bugs.
      console.error('[POST /api/epa/ai-suggest] ZodError:', err.errors);
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    // Any other failure (Prisma hiccup, Gemini infra, missing env) returns
    // a friendly 200 so the modal shows a useful empty state instead of
    // the generic "Couldn't load EPA suggestions right now" client error.
    console.error('[POST /api/epa/ai-suggest] unhandled:', err);
    return NextResponse.json({
      suggestions: [],
      note:
        "We couldn't match this case to an EPA just now — your case is saved, and you can link an EPA from the case detail page.",
    });
  }
}
