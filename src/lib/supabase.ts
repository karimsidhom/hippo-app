import { createBrowserClient } from '@supabase/ssr';
import { hippoCookieOptions } from './hippo-id';

/**
 * Browser-side Supabase client.
 * Use this in React components and client hooks.
 * Session is stored in cookies (via @supabase/ssr middleware magic).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!\n\n" +
      "Check your Supabase project's API settings to find these values\n\n" +
      "https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  // Hippo ID: parent-domain session cookie on *.hippomedicine.com.
  return createBrowserClient(url, key, {
    cookieOptions: hippoCookieOptions(typeof window === 'undefined' ? null : window.location.hostname),
  });
}
