import { db } from '@/lib/db';
import { stripHonorific } from '@/lib/names';

/**
 * Hippo ID: mirror this user's Cases identity into hub_profiles, the shared
 * profile every suite app reads (Handover's member list, Research, Study).
 * Cases owns the edit screen, so this runs after every profile or photo save.
 *
 * Writes only hub_profiles. A missing name never clears a stored one; the
 * avatar mirrors Cases exactly so removing a photo removes it everywhere.
 * Never throws: a hub failure must not fail the Cases save.
 */
export async function syncHubProfile(userId: string): Promise<void> {
  try {
    const [user, profile] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { name: true, image: true } }),
      db.profile.findUnique({
        where: { userId },
        select: { specialty: true, institution: true, trainingYearLabel: true, pgyYear: true, trainingCountry: true },
      }),
    ]);
    if (!user) return;
    const displayName = stripHonorific(user.name).slice(0, 120) || null;
    const specialty = profile?.specialty?.trim();
    const specialties = specialty ? [specialty] : [];
    const program = profile?.institution?.trim() || null;
    const level = profile?.trainingYearLabel?.trim() || (profile?.pgyYear ? `PGY-${profile.pgyYear}` : null);
    const country = profile?.trainingCountry?.trim() || null;
    const avatarUrl = user.image?.trim() || null;

    await db.$executeRaw`
      insert into public.hub_profiles (user_id, display_name, specialties, program, level, country, avatar_url)
      values (${userId}::uuid, ${displayName}, ${specialties}::text[], ${program}, ${level}, ${country}, ${avatarUrl})
      on conflict (user_id) do update set
        display_name = coalesce(excluded.display_name, public.hub_profiles.display_name),
        specialties = excluded.specialties,
        program = excluded.program,
        level = excluded.level,
        country = excluded.country,
        avatar_url = excluded.avatar_url`;
  } catch (err) {
    console.warn('[hippo:hub] profile sync failed', userId, err instanceof Error ? err.message : err);
  }
}
