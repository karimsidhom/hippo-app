import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

/**
 * Root gate — mirrors the web app's auth router at src/app/page.tsx.
 * Waits for Supabase to hydrate the cached session, then redirects to
 * either the authenticated tab stack or the login flow.
 */
export default function Index() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setIsAuthed(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthed ? '/(app)/dashboard' : '/(auth)/login'} />;
}
