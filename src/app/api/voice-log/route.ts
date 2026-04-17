import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { parseVoiceCaseLog } from "@/lib/voice-log/parse";
import { requireAiQuota, recordAiCall } from "@/lib/ai-quota";

// ---------------------------------------------------------------------------
// POST /api/voice-log
//
// Takes a raw voice transcript and returns structured CaseLog fields via
// Claude Opus 4.6. The client then pre-fills the log form with these fields
// and lets the user review + submit.
//
// Body: { transcript: string }
// ---------------------------------------------------------------------------

// Voice parsing routes through Claude Opus which typically takes 10-20s.
// Without maxDuration, Vercel kills the function at 10s and the mobile
// app sees "timeout" on voice logs that would have otherwise succeeded.
export const maxDuration = 60;

const MAX_TRANSCRIPT_LENGTH = 4_000;

interface VoiceLogBody {
  transcript?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  // Per-user daily quota — isolates heavy users from everyone else's
  // shared provider budget.
  const quota = await requireAiQuota(user.id);
  if (!quota.ok) {
    return NextResponse.json(quota.body, { status: quota.status });
  }

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

  // Only count the call against quota if the parser actually reached a
  // provider. An "unavailable" engine means all providers failed and the
  // client will get an empty-fields response — charging them for that
  // would be hostile.
  if (result.engine !== "unavailable") {
    recordAiCall(user.id, "voice-log", { transcriptLength: transcript.length });
  }

  return NextResponse.json(result);
}
