import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Sparkles, Inbox, ChevronRight } from 'lucide-react-native';
import { z } from 'zod';
import {
  Screen,
  Text,
  Card,
  Button,
  VoiceLogSheet,
  type NormalizedVoiceFields,
} from '@/components';
import { listCases, type CaseLog } from '@/lib/cases';
import { apiRequest } from '@/lib/api';
import { colors, radii } from '@/theme/tokens';

const STAFF_ROLES = new Set(['ATTENDING', 'STAFF', 'PROGRAM_DIRECTOR']);

// Minimal shape for the role + pending-count fetches. We intentionally
// don't share a schema with the inbox — this is two light reads that
// drive one dashboard card, not a cross-screen contract.
const ProfileRoleSchema = z
  .object({
    profile: z
      .object({ roleType: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const AttendingSummarySchema = z
  .object({ pendingReview: z.number().default(0) })
  .passthrough();

interface Stats {
  totalCases: number;
  thisMonth: number;
  avgOR: number | null;
  primaryRate: number;
  recentCases: CaseLog[];
}

function computeStats(cases: CaseLog[]): Stats {
  const now = new Date();
  const thisMonth = cases.filter((c) => {
    const d = new Date(c.caseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const orTimes = cases
    .map((c) => c.operativeDurationMinutes)
    .filter((m): m is number => typeof m === 'number' && m > 0);
  const avgOR = orTimes.length
    ? Math.round(orTimes.reduce((a, b) => a + b, 0) / orTimes.length)
    : null;

  const primaryRoles = new Set(['Primary Surgeon', 'Console Surgeon', 'First Surgeon']);
  const primaryCount = cases.filter((c) => primaryRoles.has(c.role)).length;
  const primaryRate = cases.length ? Math.round((primaryCount / cases.length) * 100) : 0;

  return {
    totalCases: cases.length,
    thisMonth,
    avgOR,
    primaryRate,
    recentCases: cases.slice(0, 5),
  };
}

/**
 * Dashboard. Loads /api/cases, computes the same summary the web
 * dashboard at src/app/(app)/dashboard/page.tsx shows, and renders
 * four hero stat cards + a "recent cases" list. Tapping Log jumps
 * to the dedicated log tab.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Role + pending sign-offs — loaded quietly so the staff card appears
  // only when relevant. Fails silent: residents just never see the card.
  const [roleType, setRoleType] = useState<string | null>(null);
  const [pendingSignOffs, setPendingSignOffs] = useState<number | null>(null);
  const isStaff = !!(roleType && STAFF_ROLES.has(roleType));

  useEffect(() => {
    let cancelled = false;
    apiRequest({
      path: '/api/auth/me',
      method: 'GET',
      schema: ProfileRoleSchema,
    })
      .then((me) => {
        if (cancelled) return;
        const role = me.profile?.roleType ?? null;
        setRoleType(role);
        if (role && STAFF_ROLES.has(role)) {
          apiRequest({
            path: '/api/attending/summary',
            method: 'GET',
            schema: AttendingSummarySchema,
          })
            .then((s) => {
              if (!cancelled) setPendingSignOffs(s.pendingReview ?? 0);
            })
            .catch(() => {
              if (!cancelled) setPendingSignOffs(0);
            });
        }
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Voice dictation routes through the dedicated log form so the resident
  // always sees their fields in one place. We hand the parsed fields to
  // the log tab via a route param and open it.
  const onVoiceFieldsReady = (v: NormalizedVoiceFields) => {
    // The log form reads its initial state from useState; we use a URL
    // param as a simple, stringifiable handoff channel. The log screen
    // will apply these via a useEffect on mount.
    router.push({
      pathname: '/(app)/log',
      params: { voice: JSON.stringify(v) },
    });
  };

  useEffect(() => {
    let cancelled = false;
    listCases()
      .then((c) => {
        if (!cancelled) setCases(c);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = cases ? computeStats(cases) : null;

  return (
    <Screen>
      <View style={{ gap: 4, marginBottom: 20 }}>
        <Text variant="label" tone="subtle" uppercase>
          Your case log
        </Text>
        <Text variant="h1">Dashboard</Text>
      </View>

      {error ? (
        <Card style={{ marginBottom: 16 }}>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total cases" value={stats ? String(stats.totalCases) : '—'} />
        <StatCard label="This month" value={stats ? String(stats.thisMonth) : '—'} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Avg OR time"
          value={stats?.avgOR != null ? `${stats.avgOR} min` : '—'}
        />
        <StatCard
          label="Primary surgeon"
          value={stats ? `${stats.primaryRate}%` : '—'}
        />
      </View>

      {/* Staff (attending/PD) EPA sign-off entry point. Always visible
          for staff, with a hot accent when the queue is non-empty. */}
      {isStaff ? (
        <Pressable
          onPress={() => router.push('/(app)/inbox')}
          style={({ pressed }) => {
            const hot = (pendingSignOffs ?? 0) > 0;
            return {
              opacity: pressed ? 0.85 : 1,
              marginBottom: 16,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: hot ? colors.borderGlow : colors.border,
              backgroundColor: hot ? colors.primaryDim : colors.surface,
              paddingVertical: 14,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            };
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                (pendingSignOffs ?? 0) > 0 ? colors.primaryGlow : colors.bg1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Inbox
              size={18}
              color={(pendingSignOffs ?? 0) > 0 ? colors.primary : colors.text3}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="600">
              {pendingSignOffs == null
                ? 'EPAs to complete'
                : pendingSignOffs === 0
                  ? 'EPAs to complete'
                  : pendingSignOffs === 1
                    ? '1 EPA awaiting your signature'
                    : `${pendingSignOffs} EPAs awaiting your signature`}
            </Text>
            <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
              {(pendingSignOffs ?? 0) === 0
                ? 'All caught up — tap to review.'
                : 'Residents waiting on your feedback.'}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.text3} />
        </Pressable>
      ) : null}

      {/* Primary log row — voice (hero) + manual fallback */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        <Pressable
          onPress={() => setVoiceOpen(true)}
          style={({ pressed }) => ({
            flex: 1.35,
            opacity: pressed ? 0.85 : 1,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderGlow,
            backgroundColor: colors.primaryDim,
            paddingVertical: 14,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryGlow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mic size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="body" weight="600">
                Voice log
              </Text>
              <Sparkles size={10} color={colors.primary} />
            </View>
            <Text variant="caption" tone="subtle" style={{ marginTop: 1 }}>
              ~10s after the OR
            </Text>
          </View>
        </Pressable>
        <Button
          title="Manual"
          variant="secondary"
          onPress={() => router.push('/(app)/log')}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text variant="h3">Recent cases</Text>
      </View>

      {stats && stats.recentCases.length > 0 ? (
        <View style={{ gap: 10 }}>
          {stats.recentCases.map((c) => (
            <Card key={c.id} variant="elevated" padding={14}>
              <Text variant="body" weight="600">
                {c.procedureName}
              </Text>
              <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
                {new Date(c.caseDate).toLocaleDateString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {c.attendingLabel ? ` · ${c.attendingLabel}` : ''}
                {c.role ? ` · ${c.role}` : ''}
              </Text>
            </Card>
          ))}
        </View>
      ) : stats ? (
        <Card>
          <Text variant="body" tone="muted">
            No cases yet. Log your first case to populate your dashboard.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text variant="body" tone="subtle">
            Loading…
          </Text>
        </Card>
      )}

      <VoiceLogSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onFieldsReady={(v) => {
          setVoiceOpen(false);
          onVoiceFieldsReady(v);
        }}
      />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="elevated" style={{ flex: 1 }} padding={14}>
      <Text variant="caption" tone="subtle" uppercase style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <Text variant="h2" style={{ color: colors.text }}>
        {value}
      </Text>
    </Card>
  );
}
