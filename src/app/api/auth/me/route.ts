import { NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

// Never cache the user-session response. Next/Vercel wouldn't cache an
// authed GET by default, but being explicit means a future middleware,
// CDN edge rule, or browser Back/Forward cache can't hand the user a
// stale "you're not logged in" payload after a deploy.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/me
 *
 * Returns the current user + profile. Lightweight session check.
 *
 * Self-heals: if the Supabase session is valid but the corresponding DB row
 * is missing (rare — can only happen if /api/auth/register failed partway
 * through, or if a prior `prisma migrate reset` nuked the `users` table
 * while auth.users in Supabase survived), we transparently create the
 * missing row with a default profile and return it. The client never
 * sees a 404 — they just see their normal (if minimal) profile, and can
 * complete onboarding to fill it in.
 *
 * This also shortens the login → data-visible latency for edge cases
 * where /api/auth/sync hasn't run yet on this device.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  let dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });

  if (!dbUser) {
    // Self-heal. `ensureDbUser` is idempotent and creates the profile.
    await ensureDbUser(user);
    dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
  }

  if (!dbUser) {
    // This should be impossible — ensureDbUser either creates or finds the
    // row. Log loudly so Vercel logs catch it, and fall back to a clean
    // 500 rather than letting the client crash on a missing property.
    console.error('[auth/me] ensureDbUser did not produce a row for', user.id);
    return NextResponse.json({ error: 'User record unavailable' }, { status: 500 });
  }

  return NextResponse.json(
    {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        role: dbUser.role,
      },
      profile: dbUser.profile,
    },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } },
  );
}
