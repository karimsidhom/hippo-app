import { NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * POST /api/auth/sync
 *
 * Called after login to ensure a DB user row exists.
 * Returns the user + profile.
 */
export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const dbUser = await ensureDbUser(user);

  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role },
    profile,
  });
}
