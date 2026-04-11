import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  DEFAULT_STYLE_PROFILE,
  type StyleProfile,
} from "@/lib/dictation/style/profile";
import { isStyleProfile, mergeProfiles } from "@/lib/dictation/style/serialize";

// ---------------------------------------------------------------------------
// /api/dictation/style
//
// GET    — fetch the current user's StyleProfile. Creates a default row the
//          first time a user hits this endpoint, so callers can always rely
//          on a valid profile being returned.
//
// PATCH  — shallow-merge a partial patch into the stored profile. Matches the
//          behaviour of `mergeStyleProfile()` in src/lib/dictation/style/store.ts
//          so the server and client see the same semantics.
//
// PUT    — replace the stored profile wholesale. Used for "bootstrap from
//          localStorage" on first login, and for a future "reset to default"
//          button on the settings page.
//
// DELETE — reset the profile to DEFAULT_STYLE_PROFILE.
// ---------------------------------------------------------------------------

async function loadOrCreate(userId: string): Promise<StyleProfile> {
  const row = await db.userDictationStyle.findUnique({ where: { userId } });
  if (row && isStyleProfile(row.profile)) {
    return row.profile;
  }
  // Create a default row so subsequent reads hit the fast path.
  const created = await db.userDictationStyle.upsert({
    where: { userId },
    create: {
      userId,
      profile: DEFAULT_STYLE_PROFILE as unknown as object,
      schemaVersion: DEFAULT_STYLE_PROFILE.version,
      correctionCount: 0,
    },
    update: {},
  });
  return isStyleProfile(created.profile)
    ? created.profile
    : DEFAULT_STYLE_PROFILE;
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Ensure the parent User row exists before we FK into it.
  await ensureDbUser(user);

  const profile = await loadOrCreate(user.id);
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let patch: Partial<StyleProfile>;
  try {
    patch = (await req.json()) as Partial<StyleProfile>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const current = await loadOrCreate(user.id);
  const next = mergeProfiles(current, patch);

  await db.userDictationStyle.update({
    where: { userId: user.id },
    data: {
      profile: next as unknown as object,
      schemaVersion: next.version,
      correctionCount: next.global.correctionCount ?? 0,
    },
  });

  return NextResponse.json(next);
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: StyleProfile;
  try {
    body = (await req.json()) as StyleProfile;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isStyleProfile(body)) {
    return NextResponse.json(
      { error: "Body is not a valid StyleProfile" },
      { status: 400 },
    );
  }

  // Force version + updatedAt so callers can't lie about schema shape.
  const next: StyleProfile = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  await db.userDictationStyle.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      profile: next as unknown as object,
      schemaVersion: next.version,
      correctionCount: next.global.correctionCount ?? 0,
    },
    update: {
      profile: next as unknown as object,
      schemaVersion: next.version,
      correctionCount: next.global.correctionCount ?? 0,
    },
  });

  return NextResponse.json(next);
}

export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const reset: StyleProfile = {
    ...DEFAULT_STYLE_PROFILE,
    updatedAt: new Date().toISOString(),
  };

  await db.userDictationStyle.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      profile: reset as unknown as object,
      schemaVersion: reset.version,
      correctionCount: 0,
    },
    update: {
      profile: reset as unknown as object,
      schemaVersion: reset.version,
      correctionCount: 0,
    },
  });

  return NextResponse.json(reset);
}
