import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { parseVoiceCaseLog } from "@/lib/voice-log/parse";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/voice-log
//
// Takes a raw voice transcript and returns structured CaseLog fields via
// Claude Opus 4.6. The client then pre-fills the log form with these fields
// and lets the user review + submit.
//
// Body: { transcript: string }
// ---------------------------------------------------------------------------

const MAX_TRANSCRIPT_LENGTH = 4_000;

interface VoiceLogBody {
  transcript?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const rl = checkRateLimit(`ai:voice-log:${user.id}`, LIMITS.ai);
  if (!rl.allowed) return rl.response;

  let body: VoiceLogBody;
  try {
    body = (await req.json()) as VoiceLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json(
      { error: "Body must include a non-empty `transcript` string" },
      { status: 400 },
    );
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      { error: `transcript exceeds ${MAX_TRANSCRIPT_LENGTH} chars` },
      { status: 413 },
    );
  }

  const result = await parseVoiceCaseLog(transcript);
  return NextResponse.json(result);
}
