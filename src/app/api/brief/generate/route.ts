import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { generateBrief } from "@/lib/brief/generate";
import type { BriefCaseContext } from "@/lib/brief/types";
import { parseStoredReflection } from "@/lib/debrief/types";
import { requireAiQuota, recordAiCall } from "@/lib/ai-quota";

// Allow up to 60s for the Claude/Gemini upstream call. Without this,
// Vercel kills the function at 10s and the client sees a "timeout"
// error for briefs that would have succeeded in 12-20s.
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST /api/brief/generate
//
// Body: { input: string }          — resident's free-text description, e.g.
//                                     "lap chole tomorrow with Chen"
//
// Behaviour:
//   1. Auth the user (401 if no session).
//   2. Pull the user's last 30 case logs from Postgres.
//   3. Feed the freeform input + case history to Claude via generateBrief().
//   4. Return the structured CaseBrief.
//
// The LLM call is wrapped in generateBrief so LLM errors come back as
// `engine: "unavailable"` with a warnings array rather than a 5xx — the
// client always gets something to render.
// ---------------------------------------------------------------------------

const MAX_INPUT_LENGTH = 500;
const CASE_HISTORY_LIMIT = 30;

interface GenerateBriefBody {
  input?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  // Per-user daily quota — prevents one user's heavy AI usage from
  // burning the shared provider budget for everyone else.
  const quota = await requireAiQuota(user.id);
  if (!quota.ok) {
    return NextResponse.json(quota.body, { status: quota.status });
  }

  let body: GenerateBriefBody;
  try {
    body = (await req.json()) as GenerateBriefBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userInput =
    typeof body.input === "string" ? body.input.trim() : "";
  if (!userInput) {
    return NextResponse.json(
      { error: "Body must include a non-empty `input` string" },
      { status: 400 },
    );
  }
  if (userInput.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `\`input\` exceeds the ${MAX_INPUT_LENGTH}-character limit` },
      { status: 413 },
    );
  }

  // ── Beta: everything is free, unlimited briefs for all users ──────────
  // The Pro gate is disabled during the public beta. We still write an
  // AuditLog entry per generation (below) so once we re-introduce tiers
  // we already have the monthly usage history on hand. No schema changes
  // needed when we flip this back on — just restore the `isProRole` check
  // here and the BriefMeSheet counter chip.
  const isProRole = true; // beta: everyone gets unlimited briefs

  // Pull the user's recent case log. `orderBy caseDate desc` gives the model
  // the most-relevant context; Postgres index @@index([userId, caseDate desc])
  // makes this a cheap lookup.
  const [rows, scheduledCases] = await Promise.all([
    db.caseLog.findMany({
      where: { userId: user.id },
      orderBy: { caseDate: "desc" },
      take: CASE_HISTORY_LIMIT,
      select: {
        procedureName: true,
        caseDate: true,
        role: true,
        surgicalApproach: true,
        operativeDurationMinutes: true,
        complicationCategory: true,
        outcomeCategory: true,
        notes: true,
        reflection: true,
        attendingLabel: true,
      },
    }),
    // Also fetch upcoming scheduled cases so the brief knows what's planned
    db.scheduledCase.findMany({
      where: {
        userId: user.id,
        status: { not: "cancelled" },
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: 14,
      select: {
        procedureName: true,
        attendingLabel: true,
        scheduledAt: true,
        notes: true,
      },
    }),
  ]);

  // Normalize each row's `reflection` column — structured debriefs are
  // stored as JSON, legacy rows are freeform text. Prefer the structured
  // fields: they make the Brief's "focus for this case" section dramatically
  // more useful because Claude can latch onto the user's own phrasing of
  // what they wanted to work on.
  const cases: BriefCaseContext[] = rows.map((r) => {
    const parsed = parseStoredReflection(r.reflection);
    const reflectionForPrompt = parsed.structured
      ? [
          parsed.structured.wentWell
            ? `went well: ${parsed.structured.wentWell}`
            : null,
          parsed.structured.doBetter
            ? `do better: ${parsed.structured.doBetter}`
            : null,
          parsed.structured.workOn
            ? `work on: ${parsed.structured.workOn}`
            : null,
        ]
          .filter(Boolean)
          .join(" | ")
      : parsed.freeform;

    return {
      procedureName: r.procedureName,
      caseDate: r.caseDate.toISOString(),
      role: r.role,
      surgicalApproach: r.surgicalApproach,
      operativeDurationMinutes: r.operativeDurationMinutes,
      complicationCategory: r.complicationCategory,
      outcomeCategory: r.outcomeCategory,
      notes: r.notes,
      reflection: reflectionForPrompt,
      attendingLabel: r.attendingLabel,
    };
  });

  // Build a schedule context string so the LLM knows what's already planned
  const scheduleContext = scheduledCases.length > 0
    ? scheduledCases.map((sc) => {
        const dt = new Date(sc.scheduledAt);
        const day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const parts = [`${sc.procedureName} — ${day} ${time}`];
        if (sc.attendingLabel) parts.push(`with ${sc.attendingLabel}`);
        if (sc.notes) parts.push(`(${sc.notes})`);
        return parts.join(" ");
      }).join("\n")
    : "";

  const result = await generateBrief({ userInput, cases, scheduleContext });

  // Record this call against the per-user daily quota. Fire-and-forget.
  recordAiCall(user.id, "brief", {
    inputLength: userInput.length,
    caseCount: cases.length,
    scheduledCaseCount: scheduledCases.length,
  });

  return NextResponse.json({
    ...result,
    // Beta: always report "pro" tier so the client never shows a
    // remaining-briefs counter or paywall.
    usage: {
      count: null,
      limit: null,
      tier: "pro" as const,
    },
  });
}
