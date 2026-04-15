import { useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen, Text, Input, Button } from '@/components';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

/**
 * Bare-bones signup. The full onboarding flow (specialty selection,
 * training country, PGY level, terms acceptance) still lives on the
 * web — after signup we route to /(app)/dashboard which, on first
 * load, redirects to the web onboarding URL via expo-web-browser
 * when profile.onboardingCompleted === false. Native onboarding is
 * Phase 3.
 */
export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (name.trim().length < 2) return setError('Please enter your full name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError(null);
    setLoading(true);
    const { error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
      return;
    }
    router.replace('/(app)/dashboard');
  };

  return (
    <Screen>
      <View style={{ paddingTop: 40, gap: 6, marginBottom: 28 }}>
        <Text variant="h1">Create your account</Text>
        <Text variant="body" tone="muted">
          One minute. You can finish your profile after sign-in.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="Dr. First Last" autoCapitalize="words" />
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@hospital.org"
          textContentType="emailAddress"
        />
        <Input
          label="Password"
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 8 characters"
          hint="Use a unique password you don't share with other accounts."
          textContentType="newPassword"
        />

        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}

        <Button title="Create account" onPress={onSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Link href="/(auth)/login" style={{ color: colors.primary, fontSize: 14, fontFamily: 'Geist' }}>
            I already have an account
          </Link>
        </View>
      </View>
    </Screen>
  );
}
