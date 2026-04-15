import type { ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Defaults to a scroll view; set false for fixed-height screens (e.g. the log form has its own ScrollView). */
  scroll?: boolean;
  /** Which safe-area edges to inset. Tabs screens shouldn't inset bottom (the tab bar handles it). */
  edges?: readonly Edge[];
  /** Content padding; pass 0 to handle it inside the screen yourself. */
  padding?: number;
  testID?: string;
}

/**
 * Root wrapper for every screen. Handles:
 *   - safe-area insets (the iPhone notch/home-indicator equivalent of
 *     the web app's env(safe-area-inset-*) CSS)
 *   - keyboard avoidance on iOS so inputs aren't covered when the
 *     keyboard opens
 *   - the dark background consistent with the web app
 *
 * Pulling these behaviors into one component keeps the per-screen files
 * focused on content, not chrome.
 */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  padding = 20,
  testID,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding, paddingBottom: padding + 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding }}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.bg }}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
