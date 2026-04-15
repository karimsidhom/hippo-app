import { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Card, Button } from '@/components';
import { supabase } from '@/lib/supabase';
import * as Application from 'expo-application';

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const openWeb = (path: string) => {
    // Use the platform's default browser so the user stays signed in
    // on the web if they have a session there, and so they see the
    // full legal document chrome rather than a stripped in-app view.
    void Linking.openURL(`https://hippomedicine.com${path}`);
  };

  return (
    <Screen>
      <View style={{ gap: 4, marginBottom: 20 }}>
        <Text variant="label" tone="subtle" uppercase>
          Profile
        </Text>
        <Text variant="h1">Account</Text>
      </View>

      <Card variant="elevated" style={{ marginBottom: 16 }}>
        <Text variant="caption" tone="subtle" uppercase style={{ marginBottom: 4 }}>
          Signed in as
        </Text>
        <Text variant="body" weight="600">
          {email ?? '—'}
        </Text>
      </Card>

      <View style={{ gap: 10, marginBottom: 24 }}>
        <Button
          title="Edit profile on web"
          variant="secondary"
          onPress={() => openWeb('/profile')}
          fullWidth
        />
        <Button title="Sign out" variant="danger" onPress={onSignOut} fullWidth />
      </View>

      <View style={{ gap: 4, marginBottom: 8 }}>
        <Text variant="label" tone="subtle" uppercase>
          Legal
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Button title="Terms of Use" variant="ghost" onPress={() => openWeb('/legal/terms')} fullWidth />
        <Button title="Privacy Policy" variant="ghost" onPress={() => openWeb('/legal/privacy')} fullWidth />
        <Button title="PHIA Notice" variant="ghost" onPress={() => openWeb('/legal/phia')} fullWidth />
      </View>

      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text variant="caption" tone="subtle">
          Hippo {Application.nativeApplicationVersion ?? '0.1.0'} (build{' '}
          {Application.nativeBuildVersion ?? 'dev'})
        </Text>
        <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
          © {new Date().getFullYear()} Hippo Medicine Inc.
        </Text>
      </View>
    </Screen>
  );
}
