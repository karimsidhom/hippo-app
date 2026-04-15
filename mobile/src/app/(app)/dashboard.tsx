import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Card, Button } from '@/components';
import { listCases, type CaseLog } from '@/lib/cases';
import { colors } from '@/theme/tokens';

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

      <Button
        title="Log a case"
        onPress={() => router.push('/(app)/log')}
        fullWidth
        size="lg"
        style={{ marginBottom: 24 }}
      />

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
