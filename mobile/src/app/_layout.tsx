import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';
import { colors } from '@/theme/tokens';

// Keep the splash up until fonts load — rendering Geist text with the
// system fallback and then swapping causes a visible layout jump,
// especially for tracking-tight section labels. Same idea as web's
// `display=swap` but blocking instead, because a flash of system font
// under the Hippo brand mark looks broken.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Geist_600SemiBold' },
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
