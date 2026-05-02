import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  DEFAULT_DICTATION_PREFERENCES,
  preferencesFromProfile,
  type DictationPreferences,
} from "@/lib/dictation/preferences";
import { isRegionCode } from "@/lib/dictation/billing";

// ---------------------------------------------------------------------------
// /api/dictation/preferences
//
// GET   — fetch the current user's dictation preferences (length, tone,
//         billing toggle + region, teaching pearls, postop plan inclusion,
//         missing-field prompts).
//
// PATCH — partial update. Only the fields present in the body are touched.
//
// All fields live on the Profile row.
// ---------------------------------------------------------------------------

const VALID_LENGTHS = new Set(["complete", "extra-detailed", "brief"]);
const VALID_TONES = new Set([
  "standard",
  "academic",
  "concise-attending",
  "resident-teaching",
]);
const VALID_POSTOP = new Set(["always", "if-entered"]);

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: {
      roleType: true,
      dictationLength: true,
      dictationTone: true,
      billingEnabled: true,
      billingRegion: true,
      teachingPearlsEnabled: true,
      missingFieldPromptsEnabled: true,
      postopPlanInclusion: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ ...DEFAULT_DICTATION_PREFERENCES });
  }

  const prefs = preferencesFromProfile(profile);
  return NextResponse.json(prefs);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let patch: Partial<DictationPreferences>;
  try {
    patch = (await req.json()) as Partial<DictationPreferences>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (patch.length !== undefined) {
    if (!VALID_LENGTHS.has(patch.length)) {
      return NextResponse.json({ error: "Invalid length" }, { status: 400 });
    }
    data.dictationLength = patch.length;
  }

  if (patch.tone !== undefined) {
    if (!VALID_TONES.has(patch.tone)) {
      return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
    }
    data.dictationTone = patch.tone;
  }

  if (patch.billingEnabled !== undefined) {
    data.billingEnabled = !!patch.billingEnabled;
  }

  if (patch.billingRegion !== undefined) {
    if (patch.billingRegion === null) {
      data.billingRegion = null;
    } else if (isRegionCode(patch.billingRegion)) {
      data.billingRegion = patch.billingRegion;
    } else {
      return NextResponse.json(
        { error: "Invalid billing region code" },
        { status: 400 },
      );
    }
  }

  if (patch.teachingPearlsEnabled !== undefined) {
    data.teachingPearlsEnabled = !!patch.teachingPearlsEnabled;
  }
  if (patch.missingFieldPromptsEnabled !== undefined) {
    data.missingFieldPromptsEnabled = !!patch.missingFieldPromptsEnabled;
  }
  if (patch.postopPlanInclusion !== undefined) {
    if (!VALID_POSTOP.has(patch.postopPlanInclusion)) {
      return NextResponse.json({ error: "Invalid postopPlanInclusion" }, { status: 400 });
    }
    data.postopPlanInclusion = patch.postopPlanInclusion;
  }

  if (Object.keys(data).length === 0) {
    // No-op — return current values.
    const current = await db.profile.findUnique({
      where: { userId: user.id },
      select: {
        roleType: true,
        dictationLength: true,
        dictationTone: true,
        billingEnabled: true,
        billingRegion: true,
        teachingPearlsEnabled: true,
        missingFieldPromptsEnabled: true,
        postopPlanInclusion: true,
      },
    });
    return NextResponse.json(preferencesFromProfile(current));
  }

  // Upsert so users without a Profile row still get preferences saved.
  const updated = await db.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
    select: {
      roleType: true,
      dictationLength: true,
      dictationTone: true,
      billingEnabled: true,
      billingRegion: true,
      teachingPearlsEnabled: true,
      missingFieldPromptsEnabled: true,
      postopPlanInclusion: true,
    },
  });

  return NextResponse.json(preferencesFromProfile(updated));
}
