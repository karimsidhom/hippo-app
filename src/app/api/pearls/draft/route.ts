import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { callClaude, LlmUnavailableError, AiDisabledError } from '@/lib/dictation/llm';

// Turn a logged case OR a signed EPA into a draft pearl. The point of
// Hippo's social layer is zero-friction content creation: the resident
// doesn't stare at a blank textarea — they tap "share as pearl" on a case
// they already logged and get a polished draft back to edit.

const SYSTEM_PROMPT = `You are a surgical education assistant. Given one \
clinical case or EPA observation, draft a short, engaging teaching pearl \
suitable for an attending-and-resident social feed. Output strict JSON with \
these fields:
{
  "title": "A crisp 5-10 word headline",
  "content": "80-150 words. First person. Teachable. No patient identifiers. \
End with ONE concrete takeaway. Use Canadian spelling.",
  "tags": ["3-6 lowercase tags, no #"],
  "postType": "pearl" | "case_share" | "discussion",
  "category": "Technical" | "Clinical Judgment" | "Teaching" | "Safety" | \
"Complication" | "Research"
}
Absolutely no PHI: no names, no MRN, no dates, no exact ages, no hospitals. \
Output ONLY the JSON object, no prose.`;

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;


  const { caseId, epaId } = (await req.json()) as { caseId?: string; epaId?: string };
  if (!caseId && !epaId) {
    return NextResponse.json({ error: 'caseId or epaId required' }, { status: 400 });
  }

  let source = '';
  let procedureName = '';

  if (caseId) {
    const c = await db.caseLog.findFirst({
      where: { id: caseId, userId: user.id },
      select: {
        procedureName: true, surgicalApproach: true, role: true,
        operativeDurationMinutes: true, complicationCategory: true,
        outcomeCategory: true, notes: true, reflection: true,
        difficultyScore: true,
      },
    });
    if (!c) return NextResponse.json({ error: 'case not found' }, { status: 404 });
    procedureName = c.procedureName;
    source = [
      `Procedure: ${c.procedureName}`,
      c.surgicalApproach && `Approach: ${c.surgicalApproach}`,
      c.role && `Role: ${c.role}`,
      c.operativeDurationMinutes && `Duration: ${c.operativeDurationMinutes} min`,
      c.difficultyScore && `Difficulty: ${c.difficultyScore}/5`,
      c.outcomeCategory && `Outcome: ${c.outcomeCategory}`,
      c.complicationCategory && c.complicationCategory !== 'NONE' && `Complication: ${c.complicationCategory}`,
      c.notes && `Notes: ${c.notes}`,
      c.reflection && `Reflection: ${c.reflection}`,
    ].filter(Boolean).join('\n');
  } else if (epaId) {
    const e = await db.epaObservation.findFirst({
      where: { id: epaId, userId: user.id },
      select: {
        epaId: true, epaTitle: true, setting: true, technique: true,
        entrustmentScore: true, observationNotes: true,
        strengthsNotes: true, improvementNotes: true,
        caseLog: { select: { procedureName: true } },
      },
    });
    if (!e) return NextResponse.json({ error: 'EPA not found' }, { status: 404 });
    procedureName = e.caseLog?.procedureName ?? e.epaTitle;
    source = [
      `EPA: ${e.epaId} — ${e.epaTitle}`,
      e.setting && `Setting: ${e.setting}`,
      e.technique && `Technique: ${e.technique}`,
      e.entrustmentScore && `O-Score: ${e.entrustmentScore}/5`,
      e.strengthsNotes && `Strengths: ${e.strengthsNotes}`,
      e.improvementNotes && `Improvements: ${e.improvementNotes}`,
      e.observationNotes && `Notes: ${e.observationNotes}`,
    ].filter(Boolean).join('\n');
  }

  try {
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: `Draft a teaching pearl from this record:\n\n${source}`,
      temperature: 0.6,
      maxTokens: 800,
    });

    const clean = result.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    return NextResponse.json({
      title: String(parsed.title ?? '').slice(0, 120),
      content: String(parsed.content ?? '').slice(0, 2000),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown): t is string => typeof t === 'string').slice(0, 6)
        : [],
      postType: ['pearl', 'case_share', 'discussion'].includes(parsed.postType) ? parsed.postType : 'pearl',
      category: typeof parsed.category === 'string' ? parsed.category : null,
      procedureName,
    });
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    const msg = err instanceof LlmUnavailableError ? err.message : err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: `Draft failed: ${msg}` }, { status: 502 });
  }
}
