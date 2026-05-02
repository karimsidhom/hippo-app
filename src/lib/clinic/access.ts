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

  const profile = await db.profile.findUnique({
    where: { userId: auth.user.id },
    include: { user: true },
  });
  const u = profile?.user ?? (await db.user.findUnique({ where: { id: auth.user.id } }));
  const clinician: ClinicianContext = {
    fullName: u?.name || auth.user.email.split("@")[0] || "Clinician",
    role: profile?.roleType
      ? profile.roleType.charAt(0) + profile.roleType.slice(1).toLowerCase().replace("_", " ")
      : undefined,
    specialty: profile?.specialty ?? undefined,
    province: profile?.billingRegion ?? undefined,
  };
  return { ctx: { user: auth.user, clinician }, error: null };
}

export async function loadOwnedEncounter(encounterId: string, userId: string) {
  const enc = await db.clinicEncounter.findUnique({ where: { id: encounterId } });
  if (!enc) return { encounter: null as null, error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (enc.clinicianId !== userId) {
    return { encounter: null as null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { encounter: enc, error: null };
}
