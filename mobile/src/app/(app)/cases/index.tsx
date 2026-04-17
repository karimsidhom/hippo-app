import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react-native';
import { Screen, Text, Input, Card } from '@/components';
import { listCases, type CaseLog } from '@/lib/cases';
import { colors, radii } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// Cases list — native mirror of /src/app/(app)/cases/page.tsx.
//
// Same data source (GET /api/cases, validated with the web's CaseLogSchema),
// same filters (year, approach, role), but reshuffled for one-handed mobile
// operation:
//   • Search pinned at top
//   • Year tab bar below search (All, current year, previous year…)
//   • Filter row collapses under a chip toggle (keeps the list dense)
//   • Each row is a pressable Card that pushes /cases/[id]
//
// The mobile app intentionally does NOT re-implement the Excel/PDF export
// or the dictation drawer — those flows are web-only for now and the app
// deep-links out to hippomedicine.com for heavy tasks.
// ---------------------------------------------------------------------------

const APPROACH_DOT: Record<string, string> = {
  OPEN: '#F59E0B',
  LAPAROSCOPIC: '#38BDF8',
  ROBOTIC: '#0EA5E9',
  ENDOSCOPIC: '#64748B',
  HYBRID: '#10B981',
  PERCUTANEOUS: '#F97316',
  OTHER: '#334155',
};

const APPROACH_LABEL: Record<string, string> = {
  OPEN: 'Open',
  LAPAROSCOPIC: 'Lap',
  ROBOTIC: 'Robotic',
  ENDOSCOPIC: 'Endo',
  HYBRID: 'Hybrid',
  PERCUTANEOUS: 'Perc',
  OTHER: 'Other',
};

const ROLE_LABEL: Record<string, string> = {
  OBSERVER: 'Observer',
  ASSISTANT: 'Assistant',
  FIRST_ASSISTANT: '1st Assist',
  PRIMARY_SURGEON: 'Primary',
  CONSOLE_SURGEON: 'Console',
};

const APPROACH_FILTERS = ['All', 'Open', 'Laparoscopic', 'Robotic', 'Endoscopic', 'Percutaneous'] as const;
const ROLE_FILTERS = ['All', 'Observer', 'Assistant', 'First Assistant', 'Primary Surgeon', 'Console Surgeon'] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CasesListScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseLog[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [year, setYear] = useState<string>('All');
  const [approach, setApproach] = useState<string>('All');
  const [role, setRole] = useState<string>('All');
  const [filterOpen, setFilterOpen] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await listCases();
      setCases(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cases.');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const years = useMemo(() => {
    if (!cases) return ['All'];
    const ys = [...new Set(cases.map((c) => new Date(c.caseDate).getFullYear()))].sort((a, b) => b - a);
    return ['All', ...ys.map(String)];
  }, [cases]);

  const filtered = useMemo(() => {
    if (!cases) return [];
    return cases
      .filter((c) => {
        if (search && !c.procedureName.toLowerCase().includes(search.toLowerCase())) return false;
        if (year !== 'All' && String(new Date(c.caseDate).getFullYear()) !== year) return false;
        if (approach !== 'All') {
          const want = approach.toUpperCase();
          if ((c.surgicalApproach ?? '').toUpperCase() !== want) return false;
        }
        if (role !== 'All') {
          const want = role.replace(/\s+/g, '_').toUpperCase();
          if ((c.role ?? '').replace(/\s+/g, '_').toUpperCase() !== want) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.caseDate).getTime() - new Date(a.caseDate).getTime());
  }, [cases, search, year, approach, role]);

  const hasFilters = approach !== 'All' || role !== 'All';

  if (cases === null && !error) {
    return (
      <Screen>
        <View style={{ marginBottom: 20 }}>
          <Text variant="label" tone="subtle" uppercase>Your logbook</Text>
          <Text variant="h1">Cases</Text>
        </View>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ marginBottom: 16 }}>
        <Text variant="label" tone="subtle" uppercase>Your logbook</Text>
        <Text variant="h1">Cases</Text>
        <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
          {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
          {cases && filtered.length !== cases.length ? ` of ${cases.length}` : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={{ position: 'relative', marginBottom: 10 }}>
        <SearchIcon
          size={16}
          color={colors.text3}
          style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }}
        />
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search procedures…"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={{ paddingLeft: 38 }}
        />
      </View>

      {/* Year tabs + filter toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: filterOpen ? 10 : 14,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap', gap: 6 }}>
          {years.map((y) => (
            <Pressable
              key={y}
              onPress={() => setYear(y)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radii.sm,
                backgroundColor: year === y ? colors.primaryDim : 'transparent',
                borderWidth: 1,
                borderColor: year === y ? colors.borderGlass : colors.border,
              }}
            >
              <Text
                variant="caption"
                weight="600"
                style={{ color: year === y ? colors.primary : colors.text2 }}
              >
                {y}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setFilterOpen((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: radii.sm,
            backgroundColor: filterOpen || hasFilters ? colors.primaryDim : 'transparent',
            borderWidth: 1,
            borderColor: filterOpen || hasFilters ? colors.borderGlass : colors.border,
          }}
        >
          <SlidersHorizontal size={13} color={filterOpen || hasFilters ? colors.primary : colors.text3} />
          <Text
            variant="caption"
            weight="600"
            style={{
              color: filterOpen || hasFilters ? colors.primary : colors.text3,
            }}
          >
            Filter{hasFilters ? ` · ${[approach !== 'All' ? 1 : 0, role !== 'All' ? 1 : 0].reduce((a, b) => a + b, 0)}` : ''}
          </Text>
        </Pressable>
      </View>

      {filterOpen ? (
        <Card padding={12} style={{ marginBottom: 14, gap: 12 }}>
          <FilterRow label="Approach" options={APPROACH_FILTERS} value={approach} onChange={setApproach} />
          <FilterRow label="Role" options={ROLE_FILTERS} value={role} onChange={setRole} />
          {hasFilters ? (
            <Pressable
              onPress={() => {
                setApproach('All');
                setRole('All');
              }}
              style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <X size={12} color={colors.text3} />
              <Text variant="caption" tone="subtle">Clear filters</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text variant="caption" tone="danger">{error}</Text>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Text variant="body" tone="muted">
            {cases && cases.length === 0
              ? 'No cases logged yet. Tap Log to add your first one.'
              : 'No cases match these filters.'}
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/cases/${item.id}`)}
              android_ripple={{ color: colors.glassHi }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Card variant="elevated" padding={14}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Approach dot */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        APPROACH_DOT[(item.surgicalApproach ?? '').toUpperCase()] ?? colors.muted,
                      marginTop: 2,
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="body" weight="600" numberOfLines={1}>
                      {item.procedureName}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 3,
                      }}
                    >
                      <Text variant="caption" tone="subtle">
                        {formatDate(item.caseDate)}
                      </Text>
                      {item.surgicalApproach ? (
                        <>
                          <Text variant="caption" tone="subtle">·</Text>
                          <Text variant="caption" tone="subtle">
                            {APPROACH_LABEL[item.surgicalApproach.toUpperCase()] ?? item.surgicalApproach}
                          </Text>
                        </>
                      ) : null}
                      {item.role ? (
                        <>
                          <Text variant="caption" tone="subtle">·</Text>
                          <Text variant="caption" tone="subtle">
                            {ROLE_LABEL[item.role.replace(/\s+/g, '_').toUpperCase()] ?? item.role}
                          </Text>
                        </>
                      ) : null}
                      {item.operativeDurationMinutes ? (
                        <>
                          <Text variant="caption" tone="subtle">·</Text>
                          <Text variant="caption" tone="subtle">
                            {item.operativeDurationMinutes}m
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <Text variant="label" tone="muted" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radii.sm,
                backgroundColor: selected ? colors.primaryDim : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.borderGlass : colors.border,
              }}
            >
              <Text
                variant="caption"
                weight="600"
                style={{
                  color: selected ? colors.primary : colors.text2,
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
