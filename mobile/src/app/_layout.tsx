import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/theme/tokens';

// Keep the splash up until we've bootstrapped auth. In a real app this
// gates on the first `supabase.auth.onAuthStateChange` event plus any
// required local data (style profile, cached EPA data, etc.).
SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — ignore */
});

export default function RootLayout() {
  useEffect(() => {
    // Placeholder: when auth + caches hydrate, hide the splash.
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Geist', fontWeight: '600' },
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
