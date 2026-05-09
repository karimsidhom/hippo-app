// Hippo Clinic — server-side access helpers.
//
// Centralises the "is this clinician allowed to touch this encounter?"
// check so every API route does it the same way. RLS on the database
// is the second line of defence, but checking here lets us return clean
// 404/403s and avoid round-trips that would otherwise fail at the DB.

import { NextResponse } from "next/server";
import { requireAuth, ensureDbUser, type AuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { ClinicianContext } from "./types";

export interface AuthedClinicContext {
  user: AuthedUser;
  clinician: ClinicianContext;
}

export async function requireClinicAuth(): Promise<
  | { ctx: AuthedClinicContext; error: null }
  | { ctx: null; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return { ctx: null, error: auth.error };
  await ensureDbUser(auth.user);

  // Pull profile + the dictation-style row in one go. The user's
  // surgical-side StyleProfile (preferredPhrases, avoidPhrases, brevity)
  // is reused here to bias the clinic note toward how the clinician
  // already writes — that's #2 "make it sound like me" for free.
  const [profile, dictation] = await Promise.all([
    db.profile.findUnique({ where: { userId: auth.user.id }, include: { user: true } }),
    db.userDictationStyle.findUnique({ where: { userId: auth.user.id } }),
  ]);
  const u = profile?.user ?? (await db.user.findUnique({ where: { id: auth.user.id } }));

  // Pull a small subset of style hints — keep it lean so the prompt budget
  // stays under control and we don't leak surgical-specific language.
  const stylePrefs = extractStylePrefs(dictation?.profile, profile?.dictationLength, profile?.dictationTone);

  const clinician: ClinicianContext = {
    fullName: u?.name || auth.user.email.split("@")[0] || "Clinician",
    email: auth.user.email,
    role: profile?.roleType
      ? profile.roleType.charAt(0) + profile.roleType.slice(1).toLowerCase().replace("_", " ")
      : undefined,
    roleType: profile?.roleType ?? undefined,
    specialty: profile?.specialty ?? undefined,
    province: profile?.billingRegion ?? undefined,
    stylePrefs,
  };
  return { ctx: { user: auth.user, clinician }, error: null };
}

interface StyleProfileShape {
  global?: {
    brevity?: string;
    preferredPhrases?: string[];
    avoidPhrases?: string[];
  };
}

function extractStylePrefs(
  profileJson: unknown,
  dictationLength?: string | null,
  dictationTone?: string | null,
): ClinicianContext["stylePrefs"] {
  const prefs: NonNullable<ClinicianContext["stylePrefs"]> = {};
  if (dictationLength) prefs.length = dictationLength;
  if (dictationTone)   prefs.tone = dictationTone;
  if (profileJson && typeof profileJson === "object") {
    const sp = profileJson as StyleProfileShape;
    const pp = sp.global?.preferredPhrases;
    const ap = sp.global?.avoidPhrases;
    // Cap at 8 phrases each so the prompt addendum stays small.
    if (Array.isArray(pp) && pp.length > 0) prefs.preferredPhrases = pp.slice(0, 8);
    if (Array.isArray(ap) && ap.length > 0) prefs.avoidPhrases = ap.slice(0, 8);
  }
  return Object.keys(prefs).length > 0 ? prefs : undefined;
}

export async function loadOwnedEncounter(encounterId: string, userId: string) {
  const enc = await db.clinicEncounter.findUnique({ where: { id: encounterId } });
  if (!enc) return { encounter: null as null, error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (enc.clinicianId !== userId) {
    return { encounter: null as null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { encounter: enc, error: null };
}
