import { useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen, Text, Input, Button } from '@/components';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

/**
 * Mirrors the web login flow at src/app/(auth)/login/page.tsx —
 * email + password via supabase.auth.signInWithPassword, with the
 * same "onboarding check" redirect pattern. On native we don't need
 * the splash-overlay animation the web has; the expo-router
 * transition is already cinematic enough.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) return setError('Please enter your email.');
    if (!password) return setError('Please enter your password.');
    setError(null);
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
      return;
    }
    // Redirect — the root index.tsx gate also watches auth state,
    // so we could just router.replace('/') here, but jumping straight
    // to (app) feels snappier since we know the session just landed.
    router.replace('/(app)/dashboard');
  };

  return (
    <Screen>
      <View style={{ paddingTop: 40, gap: 6, marginBottom: 28 }}>
        <Text variant="h1">Hippo</Text>
        <Text variant="body" tone="muted">
          Sign in to continue to your case log.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError(null);
          }}
          placeholder="name@hospital.org"
          textContentType="emailAddress"
        />

        <Input
          label="Password"
          autoCapitalize="none"
          autoComplete="current-password"
          secureTextEntry
          returnKeyType="go"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError(null);
          }}
          onSubmitEditing={onSubmit}
          placeholder="••••••••"
          textContentType="password"
        />

        {error ? (
          <Text variant="caption" tone="danger" style={{ marginTop: 2 }}>
            {error}
          </Text>
        ) : null}

        <Button
          title="Sign in"
          onPress={onSubmit}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Link href="/(auth)/signup" style={{ color: colors.primary, fontSize: 14, fontFamily: 'Geist' }}>
            Create an account
          </Link>
        </View>
      </View>
    </Screen>
  );
}
