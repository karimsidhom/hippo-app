import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { BarChart2, TrendingUp, ExternalLink } from 'lucide-react-native';
import { Screen, Text, Card, Button } from '@/components';
import { listCases, type CaseLog } from '@/lib/cases';
import { colors } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// Analytics — text-first KPIs.
//
// The web Analytics tab has learning curves, heatmaps, volume charts, and the
// EPA panel. Porting those to RN charts well is a multi-day project
// (react-native-svg, performance tuning on low-end devices, gestures).
// Mobile v1 intentionally ships without charts: we surface the numbers the
// user actually acts on — totals, trends, breakdowns — and defer the visual
// stuff to a subsequent release.
//
// If a user wants the full charts tonight, the "Open full analytics on web"
// button at the bottom deep-links them to the web dashboard.
// ---------------------------------------------------------------------------

const APPROACH_LABELS: Record<string, string> = {
  OPEN: 'Open',
  LAPAROSCOPIC: 'Laparoscopic',
  ROBOTIC: 'Robotic',
  ENDOSCOPIC: 'Endoscopic',
  HYBRID: 'Hybrid',
  PERCUTANEOUS: 'Percutaneous',
  OTHER: 'Other',
};

const ROLE_LABELS: Record<string, string> = {
  OBSERVER: 'Observer',
  ASSISTANT: 'Assistant',
  FIRST_ASSISTANT: 'First Assist',
  PRIMARY_SURGEON: 'Primary Surgeon',
  CONSOLE_SURGEON: 'Console Surgeon',
};

interface Stats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  primaryPct: number;
  avgOR: number | null;
  medianOR: number | null;
  totalOrHours: number;
  byRole: Map<string, number>;
  byApproach: Map<string, number>;
  bySpecialty: Map<string, number>;
  topProcedures: Array<{ name: string; count: number }>;
  monthlyVolume: Array<{ month: string; count: number }>;
}

function startOfWeek(): number {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function computeStats(cases: CaseLog[]): Stats {
  const now = new Date();
  const weekStart = startOfWeek();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  let thisWeek = 0;
  let thisMonth = 0;
  let thisYear = 0;
  const byRole = new Map<string, number>();
  const byApproach = new Map<string, number>();
  const bySpecialty = new Map<string, number>();
  const byProcedure = new Map<string, number>();
  const orTimes: number[] = [];
  // Month key: YYYY-MM. We rebuild the 6-month window at render.
  const byMonth = new Map<string, number>();

  const primaryRoles = new Set([
    'PRIMARY_SURGEON',
    'CONSOLE_SURGEON',
    'Primary Surgeon',
    'Console Surgeon',
    'First Surgeon',
  ]);
  let primaryCount = 0;

  for (const c of cases) {
    const t = new Date(c.caseDate).getTime();
    if (t >= weekStart) thisWeek++;
    if (t >= monthStart) thisMonth++;
    if (t >= yearStart) thisYear++;

    const roleKey = String(c.role ?? 'Unknown').toUpperCase();
    byRole.set(roleKey, (byRole.get(roleKey) ?? 0) + 1);
    if (primaryRoles.has(c.role) || primaryRoles.has(roleKey)) primaryCount++;

    const approachKey = String(c.surgicalApproach ?? 'OTHER').toUpperCase();
    byApproach.set(approachKey, (byApproach.get(approachKey) ?? 0) + 1);

    const spec = c.specialtyId ?? 'Unknown';
    bySpecialty.set(spec, (bySpecialty.get(spec) ?? 0) + 1);

    const proc = c.procedureName;
    if (proc) byProcedure.set(proc, (byProcedure.get(proc) ?? 0) + 1);

    if (c.operativeDurationMinutes && c.operativeDurationMinutes > 0) {
      orTimes.push(c.operativeDurationMinutes);
    }

    const d = new Date(c.caseDate);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + 1);
  }

  const total = cases.length;
  const primaryPct = total > 0 ? Math.round((primaryCount / total) * 100) : 0;
  const avgOR =
    orTimes.length > 0
      ? Math.round(orTimes.reduce((a, b) => a + b, 0) / orTimes.length)
      : null;
  const sorted = [...orTimes].sort((a, b) => a - b);
  const medianOR: number | null =
    sorted.length > 0 ? (sorted[Math.floor(sorted.length / 2)] ?? null) : null;
  const totalOrHours = Math.round(orTimes.reduce((a, b) => a + b, 0) / 60);

  const topProcedures = Array.from(byProcedure.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Last 6 months, oldest → newest, zero-filled.
  const monthlyVolume: Array<{ month: string; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyVolume.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      count: byMonth.get(mk) ?? 0,
    });
  }

  return {
    total,
    thisWeek,
    thisMonth,
    thisYear,
    primaryPct,
    avgOR,
    medianOR,
    totalOrHours,
    byRole,
    byApproach,
    bySpecialty,
    topProcedures,
    monthlyVolume,
  };
}

export default function AnalyticsScreen() {
  const [cases, setCases] = useState<CaseLog[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await listCases();
      setCases(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load stats.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => (cases ? computeStats(cases) : null), [cases]);

  if (cases === null && !error) {
    return (
      <Screen>
        <Header />
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Header />
        <Card>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </Card>
      </Screen>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Screen>
        <Header />
        <Card>
          <Text variant="body" tone="muted" style={{ lineHeight: 21 }}>
            No cases logged yet. Your stats will appear here once you log your
            first case.
          </Text>
        </Card>
      </Screen>
    );
  }

  const maxMonthly = Math.max(1, ...stats.monthlyVolume.map((m) => m.count));

  return (
    <Screen scroll={false}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* At a glance — 4 big KPIs */}
        <SectionHeader label="At a glance" />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <KpiCard label="Total cases" value={String(stats.total)} />
          <KpiCard label="This year" value={String(stats.thisYear)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
          <KpiCard label="This week" value={String(stats.thisWeek)} />
          <KpiCard label="This month" value={String(stats.thisMonth)} />
        </View>

        {/* OR time block */}
        <SectionHeader label="Operative time" />
        <Card variant="elevated" padding={14} style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Metric
              label="Total OR hours"
              value={String(stats.totalOrHours)}
              unit="h"
            />
            <Metric
              label="Average"
              value={stats.avgOR != null ? String(stats.avgOR) : '—'}
              unit="min"
            />
            <Metric
              label="Median"
              value={stats.medianOR != null ? String(stats.medianOR) : '—'}
              unit="min"
            />
          </View>
        </Card>

        {/* Primary rate */}
        <SectionHeader label="Autonomy" />
        <Card variant="elevated" padding={14} style={{ marginBottom: 22 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primaryDim,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h2" weight="700">
                {stats.primaryPct}%
              </Text>
              <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
                of cases as Primary or Console surgeon
              </Text>
            </View>
          </View>
        </Card>

        {/* 6-month bar chart (pure divs, no SVG) */}
        <SectionHeader label="Last 6 months" />
        <Card variant="elevated" padding={14} style={{ marginBottom: 22 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              height: 90,
            }}
          >
            {stats.monthlyVolume.map((m) => {
              const h = Math.max(4, Math.round((m.count / maxMonthly) * 80));
              return (
                <View key={m.month} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text variant="caption" tone="subtle" style={{ fontSize: 10 }}>
                    {m.count}
                  </Text>
                  <View
                    style={{
                      width: '90%',
                      height: h,
                      borderRadius: 3,
                      backgroundColor: colors.primary,
                      opacity: m.count === 0 ? 0.15 : 0.9,
                    }}
                  />
                  <Text
                    variant="caption"
                    tone="subtle"
                    style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {m.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Top procedures */}
        <SectionHeader label="Top procedures" />
        <Card variant="elevated" padding={14} style={{ marginBottom: 22 }}>
          <View style={{ gap: 8 }}>
            {stats.topProcedures.map((p) => {
              const maxCount = stats.topProcedures[0]?.count ?? 1;
              const pct = Math.round((p.count / maxCount) * 100);
              return (
                <View key={p.name} style={{ gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <Text
                      variant="caption"
                      numberOfLines={1}
                      style={{ flex: 1, flexShrink: 1 }}
                    >
                      {p.name}
                    </Text>
                    <Text
                      variant="caption"
                      weight="700"
                      mono
                      style={{ marginLeft: 8 }}
                    >
                      {p.count}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.surface2,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: 4,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* By role + by approach (side-by-side on wide, stacked on narrow) */}
        <SectionHeader label="Breakdown" />
        <View style={{ gap: 10, marginBottom: 22 }}>
          <BreakdownCard label="By role" entries={stats.byRole} labelMap={ROLE_LABELS} />
          <BreakdownCard label="By approach" entries={stats.byApproach} labelMap={APPROACH_LABELS} />
          {stats.bySpecialty.size > 1 ? (
            <BreakdownCard label="By specialty" entries={stats.bySpecialty} />
          ) : null}
        </View>

        {/* Escape hatch → web */}
        <Card padding={14} style={{ marginBottom: 8 }}>
          <Text variant="caption" tone="subtle" style={{ marginBottom: 10, lineHeight: 18 }}>
            The web dashboard has learning curves, volume heatmaps, and the full
            EPA panel. For the deeper view, open on your browser:
          </Text>
          <Button
            title="Open full analytics on web"
            variant="secondary"
            onPress={() => void Linking.openURL('https://hippomedicine.com/analytics')}
            leadingIcon={<ExternalLink size={13} color={colors.text2} />}
            fullWidth
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────

function Header() {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="label" tone="subtle" uppercase>
        Analytics
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <BarChart2 size={20} color={colors.text} />
        <Text variant="h1">Stats</Text>
      </View>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text
      variant="label"
      tone="muted"
      uppercase
      style={{ marginBottom: 10, letterSpacing: 1 }}
    >
      {label}
    </Text>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="elevated" padding={14} style={{ flex: 1 }}>
      <Text variant="caption" tone="subtle" uppercase style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <Text variant="h2" weight="700">
        {value}
      </Text>
    </Card>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" tone="subtle" style={{ marginBottom: 4, fontSize: 10 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text variant="h3" weight="700">
          {value}
        </Text>
        {unit && value !== '—' ? (
          <Text variant="caption" tone="subtle">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function BreakdownCard({
  label,
  entries,
  labelMap,
}: {
  label: string;
  entries: Map<string, number>;
  labelMap?: Record<string, string>;
}) {
  const total = Array.from(entries.values()).reduce((a, b) => a + b, 0);
  const rows = Array.from(entries.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      display: labelMap?.[key] ?? key,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    }));

  return (
    <Card variant="elevated" padding={14}>
      <Text variant="label" tone="muted" uppercase style={{ marginBottom: 8, fontSize: 9 }}>
        {label}
      </Text>
      <View style={{ gap: 6 }}>
        {rows.map((r) => (
          <View
            key={r.key}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Text
              variant="caption"
              style={{ flex: 1, flexShrink: 1 }}
              numberOfLines={1}
            >
              {r.display}
            </Text>
            <View
              style={{
                width: 48,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.surface2,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${r.pct}%`,
                  height: 3,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <Text variant="caption" weight="600" mono style={{ fontSize: 11, minWidth: 28, textAlign: 'right' }}>
              {r.count}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
