import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getSpecialtyEpaData } from '@/lib/epa/data';
import type { EpaDefinition, SpecialtyEpaData } from '@/lib/epa/data';
import { suggestEpasForCase } from '@/lib/epa/suggest';
import { checkAiQuota, recordAiCall } from '@/lib/ai-quota';
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
  source?: 'ai' | 'keyword' | 'ai+keyword';
}

// ── In-memory suggestion cache ─────────────────────────────────────────
// Survives across requests within the same Vercel Lambda instance.
// Key: "procedure::specialty::country", Value: { suggestions, cachedAt }.
//
// 24-hour TTL. EPA-to-procedure mappings don't change minute-to-minute;
// once we know "Laparoscopic Cholecystectomy + General Surgery + CA"
// maps to EPAs X, Y, Z, that mapping is good for the day. This caps
// Gemini calls at roughly ONE per unique procedure per lambda per day,
// which is the biggest single quota-saving lever across many users.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const suggestionCache = new Map<
  string,
  { suggestions: EpaSuggestion[]; cachedAt: number; note?: string }
>();

function cacheKey(procedure: string, specialty: string, country: string): string {
  return `${procedure.toLowerCase().trim()}::${specialty.toLowerCase().trim()}::${country}`;
}

function getCached(key: string): { suggestions: EpaSuggestion[]; note?: string } | null {
  const entry = suggestionCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    suggestionCache.delete(key);
    return null;
  }
  return { suggestions: entry.suggestions, note: entry.note };
}

function setCache(key: string, suggestions: EpaSuggestion[], note?: string): void {
  // Cap at 200 entries to prevent unbounded growth
  if (suggestionCache.size > 200) {
    const oldest = suggestionCache.keys().next().value;
    if (oldest) suggestionCache.delete(oldest);
  }
  suggestionCache.set(key, { suggestions, cachedAt: Date.now(), note });
}

/**
 * POST /api/epa/ai-suggest
 *
 * Hardened rebuild (2026-04-15) — the old route let silent empties slip
 * through to the UI, which is what users perceived as "EPAs no longer
 * link". The new contract:
 *
 *   1. Deterministic keyword scorer runs FIRST and unconditionally.
 *      It's the floor. If everything else blows up, we still return
 *      these matches.
 *   2. Gemini is called to re-rank / enhance on top. If Gemini times
 *      out, errors, or comes back empty, we drop silently to the
 *      keyword floor — never to "no suggestions".
 *   3. Every exit point returns at least as many candidates as the
 *      deterministic scorer produced (up to 5). The client will never
 *      see an empty-state except when the scorer genuinely found zero
 *      matches (no case payload at all).
 *
 * We also log structured telemetry at every decision point so the
 * pipeline is debuggable from server logs alone — no more guessing
 * whether Gemini or the scorer or the client is at fault.
 */
export const maxDuration = 60;

type CaseLike = {
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
};

function log(tag: string, data: Record<string, unknown>) {
  // One-line structured log — grep-friendly.
  console.log(`[ai-suggest:${tag}]`, JSON.stringify(data));
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const { user, error } = await requireAuth();
  if (error) {
    log('auth-fail', { status: 401 });
    return error;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = AiSuggestSchema.parse(body);

    // ── Step 1: resolve a caseLike object ───────────────────────────────
    let caseLike: CaseLike | null = null;
    let caseSource: 'caseLogId' | 'caseDetails' | 'none' = 'none';

    if (parsed.caseLogId) {
      const caseLog = await db.caseLog.findFirst({
        where: { id: parsed.caseLogId, userId: user.id },
      });
      if (caseLog) {
        caseSource = 'caseLogId';
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
      caseSource = 'caseDetails';
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
      log('case-missing', { userId: user.id, caseLogId: parsed.caseLogId });
      return NextResponse.json({
        suggestions: [],
        note: "We couldn't read this case yet — try again in a moment, or open the case to link an EPA manually.",
        diagnostics: { caseSource, reason: 'no-case-payload' },
      });
    }

    // ── Step 2: resolve specialty + EPA pool ────────────────────────────
    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    const specialty = profile?.specialty || caseLike.specialtyId || '';
    const trainingCountry = profile?.trainingCountry || 'CA';

    if (!specialty) {
      log('no-specialty', { userId: user.id });
      return NextResponse.json({
        suggestions: [],
        note: 'Set your specialty in Profile to see EPA suggestions.',
        diagnostics: { caseSource, reason: 'no-specialty' },
      });
    }

    // ── Cache check — fast path for repeated procedure+specialty combos ──
    const ck = cacheKey(caseLike.procedureName, specialty, trainingCountry);
    const cached = getCached(ck);
    if (cached) {
      log('cache-hit', { key: ck, count: cached.suggestions.length, ms: Date.now() - started });
      return NextResponse.json({
        suggestions: cached.suggestions,
        ...(cached.note ? { note: cached.note } : {}),
        diagnostics: { caseSource, specialty, trainingCountry, reason: 'cache-hit' },
      });
    }

    const specialtyEpaData = getSpecialtyEpaData(specialty, trainingCountry);
    const foundationsEpaData =
      trainingCountry === 'CA' ? getSpecialtyEpaData('surgical-foundations', 'CA') : undefined;

    if (!specialtyEpaData && !foundationsEpaData) {
      log('no-framework', { userId: user.id, specialty, trainingCountry });
      return NextResponse.json({
        suggestions: [],
        note: `No EPA framework available for ${specialty} yet.`,
        diagnostics: { caseSource, reason: 'no-framework', specialty, trainingCountry },
      });
    }

    // Merge SF + specialty EPAs — CA residents can match either track.
    const mergedEpas: EpaDefinition[] = [];
    const mergedMilestones: SpecialtyEpaData['milestones'] = [];
    const seenEpaIds = new Set<string>();
    const seenMilestoneIds = new Set<string>();

    for (const data of [foundationsEpaData, specialtyEpaData].filter(
      Boolean,
    ) as SpecialtyEpaData[]) {
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

    // ── Step 3: observation counts for gap scoring ──────────────────────
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

    // Target-count lookup for merging progress onto Gemini output.
    const epaTargetMap: Record<string, number> = {};
    const epaTitleMap: Record<string, string> = {};
    for (const epa of epaData.epas) {
      epaTargetMap[epa.id] = epa.targetCaseCount;
      epaTitleMap[epa.id] = epa.title;
    }

    // ── Step 4: run the deterministic scorer — the floor ────────────────
    let keywordFloor: EpaSuggestion[] = [];
    try {
      const fb = suggestEpasForCase(caseLike as never, epaData, observationCounts);
      keywordFloor = fb.map((s) => ({ ...s, source: 'keyword' as const }));
    } catch (scorerErr) {
      log('scorer-threw', {
        err: scorerErr instanceof Error ? scorerErr.message : String(scorerErr),
      });
    }

    log('floor', {
      userId: user.id,
      specialty,
      country: trainingCountry,
      caseSource,
      procedure: caseLike.procedureName,
      epaPool: epaData.epas.length,
      floorCount: keywordFloor.length,
      floorTop: keywordFloor.slice(0, 3).map((s) => `${s.epaId}:${s.score}`),
    });

    // ── Step 5: call Gemini to re-rank / enhance ────────────────────────
    // Per-user quota: if this user has burned their daily AI budget we
    // skip the Gemini call entirely and return the keyword floor. They
    // still get useful EPA suggestions — just without AI enhancement.
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const quota = await checkAiQuota(user.id);
    let aiResults: EpaSuggestion[] = [];
    let aiNote: string | undefined;
    let geminiReason = quota.allowed ? 'skipped' : 'user-quota-exhausted';

    if (apiKey && quota.allowed) {
      // Build a focused prompt using the keyword floor as the candidate
      // set — this both constrains Gemini to real EPAs and keeps the
      // prompt short enough to avoid context-overflow empties.
      const candidatePool =
        keywordFloor.length > 0
          ? keywordFloor.map((s) => ({
              id: s.epaId,
              title: s.epaTitle,
              keywordScore: s.score,
              currentObservations: observationCounts[s.epaId] ?? 0,
              targetCount: epaTargetMap[s.epaId] ?? 0,
            }))
          : epaData.epas.slice(0, 15).map((epa) => ({
              id: epa.id,
              title: epa.title,
              keywordScore: 0,
              currentObservations: observationCounts[epa.id] ?? 0,
              targetCount: epa.targetCaseCount,
            }));

      const prompt =
        `You are a surgical education expert helping a ${specialty} resident track EPAs.\n\n` +
        `CASE:\n` +
        `- Procedure: ${caseLike.procedureName}\n` +
        `- Category: ${caseLike.procedureCategory ?? 'N/A'}\n` +
        `- Approach: ${caseLike.surgicalApproach ?? 'N/A'}\n` +
        `- Role: ${caseLike.role ?? 'N/A'}\n` +
        `- Autonomy: ${caseLike.autonomyLevel ?? 'N/A'}\n` +
        `- Difficulty: ${caseLike.difficultyScore ?? 'N/A'}\n` +
        `- Diagnosis: ${caseLike.diagnosisCategory ?? 'N/A'}\n` +
        `- Outcome: ${caseLike.outcomeCategory ?? 'N/A'}\n` +
        `- Notes: ${caseLike.notes ?? 'N/A'}\n\n` +
        `CANDIDATE EPAs (${epaData.system}):\n${JSON.stringify(candidatePool, null, 2)}\n\n` +
        `Pick the top 3-5 EPAs that best match. Prefer EPAs where observations < target. ` +
        `Only use IDs from the candidate list. Respond ONLY with valid JSON:\n` +
        `{"suggestions":[{"epaId":"...","epaTitle":"...","confidence":"high|medium|low","score":0-100,"matchReasons":["..."]}]}`;

      try {
        const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
        let geminiData: Record<string, unknown> | null = null;
        let usedModel: string | null = null;
        let lastErr: string | null = null;

        for (const model of models) {
          const modelStart = Date.now();
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Per-model 20s budget. The route has 60s total; three
                // models × 20s leaves headroom. Without a cap, a hung
                // Gemini stall ties up the whole 60s.
                signal: AbortSignal.timeout(20_000),
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json',
                  },
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
              log('gemini-ok', { model, ms: Date.now() - modelStart });
              break;
            }

            const errText = await geminiRes.text();
            lastErr = `${model}: ${geminiRes.status} ${errText.slice(0, 200)}`;
            log('gemini-http-error', { model, status: geminiRes.status, err: errText.slice(0, 200) });
          } catch (modelErr) {
            lastErr = `${model}: ${modelErr instanceof Error ? modelErr.message : 'unknown'}`;
            log('gemini-threw', {
              model,
              err: modelErr instanceof Error ? modelErr.message : String(modelErr),
            });
          }
        }

        if (!geminiData) {
          geminiReason = `all-models-failed${lastErr ? `: ${lastErr.slice(0, 120)}` : ''}`;
          throw new Error(geminiReason);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gd = geminiData as any;
        const candidate = gd?.candidates?.[0];
        const rawText: string | undefined =
          candidate?.content?.parts?.[0]?.text ??
          (Array.isArray(candidate?.content?.parts)
            ? candidate.content.parts
                .map((p: { text?: string }) => p?.text ?? '')
                .filter(Boolean)
                .join('')
            : undefined);

        if (!rawText) {
          geminiReason = `empty-response finish=${candidate?.finishReason ?? 'unknown'}`;
          throw new Error(geminiReason);
        }

        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsedAi = JSON.parse(cleaned) as { suggestions: GeminiSuggestion[] };
        if (!Array.isArray(parsedAi.suggestions)) {
          geminiReason = 'malformed-json';
          throw new Error(geminiReason);
        }

        // Keep only suggestions whose epaId is real. Gemini hallucinates
        // EPA IDs even when constrained by a candidate list — drop those.
        const validIds = new Set(epaData.epas.map((e) => e.id));
        aiResults = parsedAi.suggestions
          .filter((s) => s && typeof s.epaId === 'string' && validIds.has(s.epaId))
          .map((s) => ({
            epaId: s.epaId,
            epaTitle: epaTitleMap[s.epaId] ?? s.epaTitle,
            confidence: s.confidence,
            score: typeof s.score === 'number' ? s.score : 0,
            matchReasons: Array.isArray(s.matchReasons) ? s.matchReasons : [],
            currentProgress: {
              observations: observationCounts[s.epaId] ?? 0,
              targetCount: epaTargetMap[s.epaId] ?? 0,
            },
            source: 'ai' as const,
          }));

        geminiReason = `ok model=${usedModel} returned=${aiResults.length}`;
        log('gemini-parsed', {
          model: usedModel,
          returned: parsedAi.suggestions.length,
          valid: aiResults.length,
        });

        // Count this successful Gemini call against the user's daily
        // AI quota. Cache hits and keyword-only paths don't charge.
        recordAiCall(user.id, 'epa-suggest', {
          model: usedModel,
          returned: aiResults.length,
          specialty,
        });
      } catch (aiErr) {
        if (!geminiReason || geminiReason === 'skipped')
          geminiReason = aiErr instanceof Error ? aiErr.message.slice(0, 120) : 'unknown';
        log('gemini-failed', { reason: geminiReason });
      }
    } else {
      geminiReason = 'no-api-key';
      log('gemini-skipped', { reason: 'no-api-key' });
    }

    // ── Step 6: merge — AI results first, keyword floor fills gaps ──────
    const final: EpaSuggestion[] = [];
    const seenIds = new Set<string>();

    for (const s of aiResults) {
      if (seenIds.has(s.epaId)) continue;
      seenIds.add(s.epaId);
      final.push(s);
    }
    for (const s of keywordFloor) {
      if (seenIds.has(s.epaId)) continue;
      seenIds.add(s.epaId);
      final.push(s);
    }

    // If AI contributed nothing, surface that subtly in the UI.
    if (aiResults.length === 0 && keywordFloor.length > 0) {
      aiNote = 'Showing smart keyword matches.';
    } else if (final.length === 0) {
      aiNote =
        "We couldn't find EPAs matching this case — you can still link one manually from the case detail page.";
    }

    const capped = final.slice(0, 5);

    // Cache the result for this procedure+specialty combo
    if (capped.length > 0) {
      setCache(ck, capped, aiNote);
    }

    log('done', {
      userId: user.id,
      ms: Date.now() - started,
      floorCount: keywordFloor.length,
      aiCount: aiResults.length,
      finalCount: capped.length,
      geminiReason,
    });

    return NextResponse.json({
      suggestions: capped,
      ...(aiNote ? { note: aiNote } : {}),
      diagnostics: {
        caseSource,
        specialty,
        trainingCountry,
        epaPool: epaData.epas.length,
        floor: keywordFloor.length,
        ai: aiResults.length,
        geminiReason,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      log('bad-request', { errors: err.errors });
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    log('unhandled', { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({
      suggestions: [],
      note: "We couldn't match this case to an EPA just now — your case is saved, and you can link an EPA from the case detail page.",
      diagnostics: { reason: 'unhandled', message: err instanceof Error ? err.message : String(err) },
    });
  }
}
