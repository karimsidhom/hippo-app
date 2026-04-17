// ---------------------------------------------------------------------------
// Program authorization helpers
// ---------------------------------------------------------------------------
import { db } from './db';

/**
 * Returns the user's membership row for the given program, or null if the user
 * is not a member.
 */
export async function getMembership(userId: string, programId: string) {
  return db.programMember.findUnique({
    where: { programId_userId: { programId, userId } },
  });
}

/**
 * True if the user has OWNER role on the program (PD who created it or was
 * promoted).
 */
export async function isProgramOwner(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await getMembership(userId, programId);
  return m?.role === 'OWNER';
}

/**
 * True if the user is any member (OWNER or MEMBER).
 */
export async function isProgramMember(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await getMembership(userId, programId);
  return !!m;
}

/**
 * True iff the user is a Program Director (the only role that can create
 * programs). Attendings/staff cannot create programs but can be invited.
 */
export async function isProgramDirector(userId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({ where: { userId } });
  return profile?.roleType === 'PROGRAM_DIRECTOR';
}
