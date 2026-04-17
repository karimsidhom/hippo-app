import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { callClaude } from "@/lib/dictation/llm";
import { scrubNotes } from "@/lib/phia";
import { requireAiQuota, recordAiCall } from "@/lib/ai-quota";

// ---------------------------------------------------------------------------
// POST /api/epa/oscore-suggest
//
// AI O-score recommender for attendings at sign-off time. Given an
// EPA observation id, reads the case context + resident's self-assessment
// and returns a recommended entrustment score (1-5) with one-line reasoning.
//
// Gate: ATTENDING / PROGRAM_DIRECTOR / STAFF only. Residents cannot call
// this on their own submissions.
//
// This is a Pro feature — enforcement happens at the client. Server logs
// usage to AuditLog so Pro-tier analytics can track ROI.
//
// Response shape:
//   {
//     score: 1 | 2 | 3 | 4 | 5,
//     confidence: "low" | "medium" | "high",
//     reasoning: string,  // one-sentence rationale for the score
//   }
//
// The LLM is asked for strict JSON; we validate and fall back to a safe
// default if parsing fails.
// ---------------------------------------------------------------------------

// Claude Opus typically returns in 5-15s; 60s gives plenty of headroom for
// the occasional slow response without the client seeing a Vercel timeout.
export const maxDuration = 60;

const OscoreSchema = z.object({
  observationId: z.string().min(1),
});

type OscoreResult = {
  score: 1 | 2 | 3 | 4 | 5;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  engine?: "ai" | "fallback";
};

const SYSTEM_PROMPT = `You are an experienced staff surgeon helping a colleague sign off a resident's EPA observation in a competency-based medical education system.

Given the case context and the resident's self-assessment, recommend an entrustment score from 1 to 5:

  1 = "Had to do" — attending did most of the work
  2 = "Talk through" — resident needed step-by-step guidance
  3 = "Prompted" — resident needed occasional prompts
  4 = "Just in case" — attending watched but did not intervene
  5 = "Independent" — resident could have done it solo

Weigh: resident's autonomy level, procedure difficulty, role, operative time, outcome, and any notes. Be calibrated — a score of 5 is rare for early trainees on complex cases, and 1 should be reserved for real struggle, not just novice exposure.

Reply with STRICT JSON only (no prose, no markdown):
{"score": <1-5>, "confidence": "low"|"medium"|"high", "reasoning": "<one sentence, max 140 chars>"}`;

function parseOscoreJson(text: string): OscoreResult | null {
  // Accept raw JSON or JSON wrapped in ```json fences.
  let raw = text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) raw = fenced[1].trim();
  try {
    const parsed = JSON.parse(raw);
    const score = Number(parsed.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return null;
    const conf = String(parsed.confidence ?? "medium").toLowerCase();
    const confidence: OscoreResult["confidence"] =
      conf === "high" || conf === "low" ? (conf as "high" | "low") : "medium";
    const reasoning = String(parsed.reasoning ?? "").slice(0, 200).trim();
    if (!reasoning) return null;
    return {
      score: score as 1 | 2 | 3 | 4 | 5,
      confidence,
      reasoning,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OscoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "observationId is required" },
      { status: 400 },
    );
  }

  // Auth: must be attending/PD/staff
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  const isStaff =
    profile?.roleType === "ATTENDING" ||
    profile?.roleType === "STAFF" ||
    profile?.roleType === "PROGRAM_DIRECTOR";
  if (!isStaff) {
    return NextResponse.json(
      { error: "Forbidden — staff only." },
      { status: 403 },
    );
  }

  // Per-user daily quota — an attending who spams "AI suggest" across 100
  // sign-offs shouldn't be able to starve the residents' quota.
  const quota = await requireAiQuota(user.id);
  if (!quota.ok) {
    return NextResponse.json(quota.body, { status: quota.status });
  }

  const obs = await db.epaObservation.findUnique({
    where: { id: parsed.data.observationId },
    include: {
      caseLog: {
        select: {
          procedureName: true,
          procedureCategory: true,
          surgicalApproach: true,
          role: true,
          autonomyLevel: true,
          difficultyScore: true,
          operativeDurationMinutes: true,
          diagnosisCategory: true,
          outcomeCategory: true,
          complicationCategory: true,
          notes: true,
        },
      },
    },
  });

  if (!obs) {
    return NextResponse.json({ error: "Observation not found" }, { status: 404 });
  }

  // Build the user prompt from scrubbed observation + case context.
  const caseLines: string[] = [];
  if (obs.caseLog) {
    const c = obs.caseLog;
    caseLines.push(`Procedure: ${c.procedureName}`);
    if (c.procedureCategory) caseLines.push(`Category: ${c.procedureCategory}`);
    if (c.surgicalApproach) caseLines.push(`Approach: ${c.surgicalApproach}`);
    if (c.role) caseLines.push(`Role: ${c.role}`);
    if (c.autonomyLevel) caseLines.push(`Autonomy: ${c.autonomyLevel}`);
    if (c.difficultyScore) caseLines.push(`Difficulty: ${c.difficultyScore}/5`);
    if (c.operativeDurationMinutes)
      caseLines.push(`OR time: ${c.operativeDurationMinutes} min`);
    if (c.diagnosisCategory) caseLines.push(`Diagnosis: ${c.diagnosisCategory}`);
    if (c.outcomeCategory) caseLines.push(`Outcome: ${c.outcomeCategory}`);
    if (c.complicationCategory && c.complicationCategory !== "NONE")
      caseLines.push(`Complication: ${c.complicationCategory}`);
    if (c.notes) caseLines.push(`Case notes: ${scrubNotes(c.notes)}`);
  } else {
    caseLines.push("(No linked case log — grade from observation context alone.)");
  }

  const obsLines: string[] = [
    `EPA: ${obs.epaId} — ${obs.epaTitle}`,
  ];
  if (obs.setting) obsLines.push(`Setting: ${obs.setting}`);
  if (obs.complexity) obsLines.push(`Complexity: ${obs.complexity}`);
  if (obs.entrustmentScore)
    obsLines.push(`Resident's self-score: ${obs.entrustmentScore}/5`);
  if (obs.observationNotes)
    obsLines.push(
      `Resident's notes: ${scrubNotes(obs.observationNotes)}`,
    );

  const userPrompt = [
    "## Case context",
    ...caseLines,
    "",
    "## Observation",
    ...obsLines,
    "",
    "Return only the strict JSON object as specified in your instructions.",
  ].join("\n");

  // Call the LLM. On any failure, return a calibrated fallback so the
  // UI never shows an error — the attending just loses the AI hint.
  let result: OscoreResult | null = null;
  let engine: "ai" | "fallback" = "fallback";

  try {
    const llm = await callClaude({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.2,
      maxTokens: 300,
    });
    result = parseOscoreJson(llm.text);
    if (result) engine = "ai";
  } catch (err) {
    console.warn("[oscore-suggest] LLM error:", err);
  }

  if (!result) {
    // Deterministic fallback: echo the resident's self-score (or 3) with
    // low confidence. Safer than pretending we have an AI opinion.
    const self = obs.entrustmentScore ?? 3;
    const safe = Math.max(1, Math.min(5, self)) as 1 | 2 | 3 | 4 | 5;
    result = {
      score: safe,
      confidence: "low",
      reasoning:
        "AI unavailable — echoing the resident's self-assessment. Adjust based on what you observed.",
    };
  }

  // Only count against daily quota if we actually reached the AI — the
  // deterministic fallback is free (no provider call made).
  if (engine === "ai") {
    recordAiCall(user.id, "oscore-suggest", {
      suggested: result.score,
      residentSelf: obs.entrustmentScore ?? null,
      observationId: obs.id,
    });
  }

  return NextResponse.json({ ...result, engine });
}
