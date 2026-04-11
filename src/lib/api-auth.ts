import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from './supabase-server';
import { db } from './db';

export type AuthedUser = {
  id: string;
  email: string;
};

/**
 * Extract and verify the authenticated user from the request cookies.
 * Returns the Supabase auth user on success, or a 401 NextResponse on failure.
 *
 * Usage in API routes:
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 */
export async function requireAuth(): Promise<
  { user: AuthedUser; error: null } | { user: null; error: NextResponse }
> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    return { user: { id: user.id, email: user.email! }, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
}

/**
 * Ensure the user has a corresponding row in our `users` table.
 * Creates one (with a default profile) if missing — idempotent.
 */
export async function ensureDbUser(authUser: AuthedUser, name?: string) {
  const existing = await db.user.findUnique({ where: { id: authUser.id } });
  if (existing) return existing;

  return db.user.create({
    data: {
      id: authUser.id,
      email: authUser.email,
      name: name ?? authUser.email.split('@')[0],
      profile: { create: { onboardingCompleted: false } },
    },
    include: { profile: true },
  });
}
