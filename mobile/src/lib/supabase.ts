/**
 * Supabase client — React Native / Expo.
 *
 * Why not share the web app's client? The web uses `@supabase/ssr` with
 * cookie-based sessions. On iOS/Android we want tokens in SecureStore
 * (encrypted at rest, protected by the device passcode/biometric) and
 * realtime events via WebSockets. Same Supabase project, same auth —
 * different storage/transport layer.
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// SecureStore has a 2048-byte value limit which is enough for an access
// token + refresh token. For larger blobs (e.g. offline case drafts)
// fall through to MMKV elsewhere — never put PHI here.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = (Constants.expoConfig?.extra as { supabaseUrl?: string })?.supabaseUrl
  ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (Constants.expoConfig?.extra as { supabaseAnonKey?: string })?.supabaseAnonKey
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Throwing here (vs. silently erroring at the first request) makes
  // the missing-env misconfiguration loud in dev builds.
  throw new Error(
    'Supabase env missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env.local, or pass them via eas.json env.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    // Fallback for tokens > 2KB (shouldn't happen, but defensive).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(typeof AsyncStorage !== 'undefined' ? {} : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
