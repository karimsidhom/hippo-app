import { useEffect, useState } from 'react';
import { View, Linking, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ExternalLink, LogOut, Building2, GraduationCap, MessageSquare, Mail, User as UserIcon } from 'lucide-react-native';
import { z } from 'zod';
import { Screen, Text, Card, Button } from '@/components';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/api';
import { colors } from '@/theme/tokens';
import * as Application from 'expo-application';

// ---------------------------------------------------------------------------
// Profile / account screen.
//
// Loads the user's identity + training context from /api/auth/me so the
// resident sees their own info at the top without needing to tap through
// to the web. Everything deeper (editing fields, granular privacy toggles,
// exports, delete account) deep-links to hippomedicine.com — the settings
// UI on web is a 9-tab monster that's not worth reimplementing on mobile
// until we know which tabs residents actually touch.
// ---------------------------------------------------------------------------

const ROLE_LABEL: Record<string, string> = {
  RESIDENT: 'Resident',
  FELLOW: 'Fellow',
  ATTENDING: 'Attending',
  STAFF: 'Staff surgeon',
  PROGRAM_DIRECTOR: 'Program Director',
};

const MeSchema = z
  .object({
    user: z
      .object({
        id: z.string(),
        email: z.string(),
        name: z.string().nullable().optional(),
      })
      .passthrough(),
    profile: z
      .object({
        roleType: z.string().nullable().optional(),
        specialty: z.string().nullable().optional(),
        subspecialty: z.string().nullable().optional(),
        institution: z.string().nullable().optional(),
        trainingYearLabel: z.string().nullable().optional(),
        pgyYear: z.number().nullable().optional(),
        trainingCountry: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

type Me = z.infer<typeof MeSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest({
      path: '/api/auth/me',
      method: 'GET',
      schema: MeSchema,
    })
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        // Fall back to Supabase email only — non-critical.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const openWeb = (path: string) => {
    // Use the platform's default browser so the user stays signed in on
    // the web if they have a session there, and so they see the full
    // chrome rather than a stripped in-app view.
    void Linking.openURL(`https://hippomedicine.com${path}`);
  };

  const displayName = me?.user.name ?? me?.user.email ?? null;
  const role = me?.profile?.roleType ? ROLE_LABEL[me.profile.roleType] ?? me.profile.roleType : null;
  const specialty =
    [me?.profile?.specialty, me?.profile?.subspecialty].filter(Boolean).join(' · ') || null;
  const trainingYear =
    me?.profile?.trainingYearLabel ??
    (me?.profile?.pgyYear != null ? `PGY-${me.profile.pgyYear}` : null);

  return (
    <Screen>
      <View style={{ gap: 4, marginBottom: 20 }}>
        <Text variant="label" tone="subtle" uppercase>
          Profile
        </Text>
        <Text variant="h1">Account</Text>
      </View>

      {/* Identity card */}
      <Card variant="elevated" padding={16} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryDim,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderGlow,
            }}
          >
            <UserIcon size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <Text variant="body" weight="600" numberOfLines={1}>
                  {displayName ?? '—'}
                </Text>
                <Text variant="caption" tone="subtle" numberOfLines={1} style={{ marginTop: 2 }}>
                  {me?.user.email ?? ''}
                </Text>
              </>
            )}
          </View>
        </View>

        {(role || trainingYear || specialty || me?.profile?.institution) && (
          <View style={{ marginTop: 14, gap: 8 }}>
            {role || trainingYear ? (
              <ProfileRow
                icon={<GraduationCap size={13} color={colors.text3} />}
                value={[role, trainingYear].filter(Boolean).join(' · ') || '—'}
              />
            ) : null}
            {specialty ? (
              <ProfileRow
                icon={<MessageSquare size={13} color={colors.text3} />}
                value={specialty}
              />
            ) : null}
            {me?.profile?.institution ? (
              <ProfileRow
                icon={<Building2 size={13} color={colors.text3} />}
                value={me.profile.institution}
              />
            ) : null}
          </View>
        )}
      </Card>

      {/* Quick actions → web */}
      <View style={{ gap: 10, marginBottom: 22 }}>
        <Button
          title="Edit profile on web"
          variant="secondary"
          onPress={() => openWeb('/profile')}
          leadingIcon={<ExternalLink size={14} color={colors.text2} />}
          fullWidth
        />
        <Button
          title="Settings on web"
          variant="secondary"
          onPress={() => openWeb('/settings')}
          leadingIcon={<ExternalLink size={14} color={colors.text2} />}
          fullWidth
        />
        <Button
          title="Send feedback to developer"
          variant="secondary"
          onPress={() => openWeb('/settings?tab=feedback')}
          leadingIcon={<Mail size={14} color={colors.text2} />}
          fullWidth
        />
      </View>

      {/* Legal */}
      <View style={{ marginBottom: 8 }}>
        <Text variant="label" tone="subtle" uppercase>
          Legal
        </Text>
      </View>
      <View style={{ gap: 6, marginBottom: 22 }}>
        <Button title="Terms of Use" variant="ghost" onPress={() => openWeb('/legal/terms')} fullWidth />
        <Button title="Privacy Policy" variant="ghost" onPress={() => openWeb('/legal/privacy')} fullWidth />
        <Button title="PHIA Notice" variant="ghost" onPress={() => openWeb('/legal/phia')} fullWidth />
        <Button title="Acceptable Use" variant="ghost" onPress={() => openWeb('/legal/acceptable-use')} fullWidth />
      </View>

      {/* Danger zone */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        <Button
          title="Sign out"
          variant="danger"
          onPress={onSignOut}
          leadingIcon={<LogOut size={14} color="#ffffff" />}
          fullWidth
        />
      </View>

      <View style={{ marginTop: 12, alignItems: 'center', gap: 4 }}>
        <Text variant="caption" tone="subtle" style={{ fontSize: 11 }}>
          Hippo{' '}
          {Application.nativeApplicationVersion ?? '0.1.0'} (build{' '}
          {Application.nativeBuildVersion ?? 'dev'})
        </Text>
        <Text variant="caption" tone="subtle" style={{ fontSize: 11 }}>
          Hippo™ · © {new Date().getFullYear()} Hippo Medicine Inc.
        </Text>
      </View>
    </Screen>
  );
}

function ProfileRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {icon}
      <Text variant="caption" tone="subtle" style={{ flex: 1 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
