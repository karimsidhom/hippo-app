import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase-server';
import { db } from './db';

export type AuthedUser = {
  id: string;
  email: string;
};

/**
 * Extract and verify the authenticated user.
 *
 * Two transports are accepted:
 *   1. Supabase session cookie (used by the Next.js web app).
 *   2. `Authorization: Bearer <jwt>` header (used by the native iOS/
 *      Android apps, which store the access token in SecureStore
 *      rather than a cookie — see mobile/src/lib/supabase.ts).
 *
 * Cookie is checked first because it's the common case and costs
 * nothing. If that fails we fall through to the header. Either path
 * produces the same `AuthedUser` so downstream code is transport-
 * agnostic.
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

    if (!error && user) {
      return { user: { id: user.id, email: user.email! }, error: null };
    }
  } catch {
    // Fall through to bearer-token path.
  }

  // Bearer-token fallback for the mobile app. We verify the JWT with
  // a fresh anon-key client (`@supabase/supabase-js`, not `@supabase/ssr`,
  // because we don't want cookie side-effects in this path).
  try {
    const hdrs = await headers();
    const authHeader = hdrs.get('authorization') ?? hdrs.get('Authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && anon) {
          const client = createClient(url, anon, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await client.auth.getUser(token);
          if (!error && data.user) {
            return {
              user: { id: data.user.id, email: data.user.email! },
              error: null,
            };
          }
        }
      }
    }
  } catch {
    // Intentionally swallow — we'll return a clean 401 below.
  }

  return {
    user: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
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
