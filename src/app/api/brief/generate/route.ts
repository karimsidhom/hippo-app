import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { generateBrief } from "@/lib/brief/generate";
import type { BriefCaseContext } from "@/lib/brief/types";

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

  // Pull the user's recent case log. `orderBy caseDate desc` gives the model
  // the most-relevant context; Postgres index @@index([userId, caseDate desc])
  // makes this a cheap lookup.
  const rows = await db.caseLog.findMany({
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
  });

  const cases: BriefCaseContext[] = rows.map((r) => ({
    procedureName: r.procedureName,
    caseDate: r.caseDate.toISOString(),
    role: r.role,
    surgicalApproach: r.surgicalApproach,
    operativeDurationMinutes: r.operativeDurationMinutes,
    complicationCategory: r.complicationCategory,
    outcomeCategory: r.outcomeCategory,
    notes: r.notes,
    reflection: r.reflection,
    attendingLabel: r.attendingLabel,
  }));

  const result = await generateBrief({ userInput, cases });
  return NextResponse.json(result);
}
