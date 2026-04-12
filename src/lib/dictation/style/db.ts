import { db } from "@/lib/db";
import { DEFAULT_STYLE_PROFILE, type StyleProfile } from "./profile";
import { isStyleProfile } from "./serialize";

// ---------------------------------------------------------------------------
// Server-side DB loader for the user's StyleProfile. Extracted so both the
// /api/dictation/style CRUD route and the /api/dictation/revise route can
// share the same lazy-create semantics without duplicating logic.
//
// Client code must NOT import this module — it pulls in Prisma, which has no
// business in a client bundle. Use `getStyleProfile()` from ./store instead.
// ---------------------------------------------------------------------------

/**
 * Load the user's StyleProfile from the database, creating a default row on
 * first access so subsequent reads always hit the fast path.
 */
export async function loadOrCreateStyleProfile(
  userId: string,
): Promise<StyleProfile> {
  const row = await db.userDictationStyle.findUnique({ where: { userId } });
  if (row && isStyleProfile(row.profile)) {
    return row.profile;
  }
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
