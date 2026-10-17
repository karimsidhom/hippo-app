import { headers } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Hippo Link: a Supabase client acting as the signed-in user, so row level
 * security on hub_handoffs (owner reads and closes only their own rows) is
 * what keeps users apart, not just a where clause. Cookie session first
 * (web), then a bearer token (the mobile app), mirroring requireAuth().
 */
export async function linkClient(): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return { supabase: supabase as unknown as SupabaseClient, userId: data.user.id };
  } catch {
    // Fall through to the bearer token.
  }

  try {
    const auth = (await headers()).get('authorization') ?? '';
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (auth.toLowerCase().startsWith('bearer ') && url && anon) {
      const token = auth.slice(7).trim();
      const supabase = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) return { supabase, userId: data.user.id };
    }
  } catch {
    // Clean 401 from the caller.
  }
  return null;
}
