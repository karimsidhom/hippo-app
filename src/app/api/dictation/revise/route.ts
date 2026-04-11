import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { reviseDictation } from "@/lib/dictation/revise";
import { loadOrCreateStyleProfile } from "@/lib/dictation/style/db";
import type { LengthLevel, ServiceKey } from "@/lib/dictation/types";

// ---------------------------------------------------------------------------
// POST /api/dictation/revise
//
// Takes a rough operative dictation plus the target service/length and
// returns a Claude Opus 4.6 polished version pinned to the user's learned
// StyleProfile.
//
// The ANTHROPIC_API_KEY lives only on the server — clients never see it.
// If the key is missing or Claude errors, the underlying `reviseDictation`
// falls back to the deterministic style pass and flags it via
// `engine: "deterministic-fallback"` so the UI can surface a warning.
// ---------------------------------------------------------------------------

const KNOWN_SERVICES: ReadonlySet<ServiceKey> = new Set([
  "general-surgery",
  "vascular",
  "obgyn",
  "urology",
  "plastics",
  "orthopedics",
  "neurosurgery",
  "ent",
  "pediatric-surgery",
  "cardiothoracic",
  "unknown",
]);

const KNOWN_LENGTHS: ReadonlySet<LengthLevel> = new Set([
  "full",
  "concise",
  "handover",
]);

// Guard against runaway payloads — a normal operative note is well under
// 20kB. Anything larger is almost certainly a bug or an abuse attempt.
const MAX_ROUGH_LENGTH = 20_000;

interface ReviseRequestBody {
  rough?: unknown;
  service?: unknown;
  length?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: ReviseRequestBody;
  try {
    body = (await req.json()) as ReviseRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Validate -------------------------------------------------------------
  const rough = typeof body.rough === "string" ? body.rough.trim() : "";
  if (!rough) {
    return NextResponse.json(
      { error: "Body must include a non-empty `rough` string" },
      { status: 400 },
    );
  }
  if (rough.length > MAX_ROUGH_LENGTH) {
    return NextResponse.json(
      { error: `\`rough\` exceeds the ${MAX_ROUGH_LENGTH}-character limit` },
      { status: 413 },
    );
  }

  const service =
    typeof body.service === "string" && KNOWN_SERVICES.has(body.service as ServiceKey)
      ? (body.service as ServiceKey)
      : "unknown";

  const length: LengthLevel =
    typeof body.length === "string" && KNOWN_LENGTHS.has(body.length as LengthLevel)
      ? (body.length as LengthLevel)
      : "full";

  // --- Load profile + revise ------------------------------------------------
  const profile = await loadOrCreateStyleProfile(user.id);

  const result = await reviseDictation({ rough, service, length, profile });

  return NextResponse.json(result);
}
