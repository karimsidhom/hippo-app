import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { callClaude, LlmUnavailableError, AiDisabledError } from "@/lib/dictation/llm";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/schedule/bulk
//
// Takes a freeform voice/text transcript describing multiple upcoming cases
// (e.g. "PCNL Monday 7am, robot prostatectomy Friday with Dr. Naks") and
// creates ALL of them in one shot. No parse-then-review — the cases are
// saved immediately and the client just refreshes the list.
//
// Claude extracts an array of { procedureName, attendingLabel?, dayOfWeek,
// time? } and we resolve the day-of-week to an actual date relative to the
// current week.
// ---------------------------------------------------------------------------

const MAX_TRANSCRIPT = 2_000;

const SYSTEM_PROMPT = `You parse a surgeon's description of their upcoming OR cases for the week into structured JSON.

The input is free-form text (likely from voice dictation) describing one or more surgical cases scheduled for this week. Extract ALL cases mentioned.

Return ONLY a JSON array (no markdown, no code fence) where each element has:
{
  "procedureName": string,       // formal procedure name, e.g. "Percutaneous Nephrolithotomy" not "PCNL"
  "attendingLabel": string|null, // attending name if mentioned, null otherwise
  "dayOfWeek": string,           // one of: "monday","tuesday","wednesday","thursday","friday","saturday","sunday","today","tomorrow"
  "time": string|null            // 24h format like "07:00", or null if not mentioned
}

Rules:
- Extract EVERY case mentioned. If they say "3 cases Monday" but only name 2, extract the 2 you can identify.
- Use formal procedure names (expand abbreviations: "lap chole" → "Laparoscopic Cholecystectomy", "PCNL" → "Percutaneous Nephrolithotomy", "RALP" → "Robot-Assisted Laparoscopic Prostatectomy", "TURBT" → "Transurethral Resection of Bladder Tumor", etc.)
- If no time is given, default to null (the server will use 07:00).
- If "Dr." or "with" precedes a name, that's the attending.
- Return the JSON array and nothing else.`;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
  return fence ? fence[1].trim() : trimmed;
}

interface ParsedCase {
  procedureName: string;
  attendingLabel: string | null;
  dayOfWeek: string;
  time: string | null;
}

function resolveDate(dayOfWeek: string): Date {
  const now = new Date();
  const today = now.getDay(); // 0=Sun, 1=Mon, ...

  if (dayOfWeek === "today") return now;
  if (dayOfWeek === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  const target = dayMap[dayOfWeek.toLowerCase()];
  if (target === undefined) return now;

  let daysAhead = target - today;
  if (daysAhead <= 0) daysAhead += 7; // next week if the day has passed
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  return d;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const rl = checkRateLimit(`ai:schedule-bulk:${user.id}`, LIMITS.ai);
  if (!rl.allowed) return rl.response;

  let body: { transcript?: unknown; tzOffsetMinutes?: unknown };
  try {
    body = (await req.json()) as { transcript?: unknown; tzOffsetMinutes?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  // Client's timezone offset in minutes (from Date.getTimezoneOffset(), where
  // positive = behind UTC). Used to translate the AI-parsed local time
  // ("Monday 07:00") into a UTC instant that displays correctly in the
  // client's timezone — critical because Vercel runs in UTC.
  const tzOffsetMinutes =
    typeof body.tzOffsetMinutes === "number" ? body.tzOffsetMinutes : 0;
  if (!transcript) {
    return NextResponse.json(
      { error: "Body must include a non-empty `transcript` string" },
      { status: 400 },
    );
  }
  if (transcript.length > MAX_TRANSCRIPT) {
    return NextResponse.json(
      { error: `transcript exceeds ${MAX_TRANSCRIPT} chars` },
      { status: 413 },
    );
  }

  // Ask Claude to extract all cases.
  let cases: ParsedCase[];
  try {
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: `Today is ${todayStr}.\n\nTranscript:\n${transcript}\n\nReturn the JSON array now.`,
      temperature: 0.1,
      maxTokens: 2048,
    });

    const cleaned = stripCodeFence(result.text);
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array");
    }
    cases = parsed.filter(
      (c: unknown): c is ParsedCase =>
        !!c &&
        typeof c === "object" &&
        typeof (c as Record<string, unknown>).procedureName === "string" &&
        !!(c as Record<string, unknown>).procedureName,
    );
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    const msg =
      err instanceof LlmUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    return NextResponse.json(
      { error: `Failed to parse cases: ${msg}` },
      { status: 422 },
    );
  }

  if (cases.length === 0) {
    return NextResponse.json(
      { error: "Could not identify any cases from the transcript" },
      { status: 422 },
    );
  }

  // Create all scheduled cases.
  const created = await Promise.all(
    cases.map((c) => {
      const dateObj = resolveDate(c.dayOfWeek);
      const [hours, minutes] = (c.time ?? "07:00").split(":").map(Number);
      // Set the wall-clock time in the client's timezone, then translate to
      // UTC for storage. Using setUTCHours + the client's tz offset avoids
      // the server's own timezone (Vercel = UTC) skewing the stored value.
      dateObj.setUTCHours((hours || 7), (minutes || 0), 0, 0);
      dateObj.setUTCMinutes(dateObj.getUTCMinutes() + tzOffsetMinutes);

      return db.scheduledCase.create({
        data: {
          userId: user.id,
          procedureName: c.procedureName,
          attendingLabel: c.attendingLabel || null,
          scheduledAt: dateObj,
        },
      });
    }),
  );

  return NextResponse.json({ created, count: created.length }, { status: 201 });
}
