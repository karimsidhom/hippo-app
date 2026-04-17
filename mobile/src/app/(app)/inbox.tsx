import { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import {
  Inbox,
  Stethoscope,
  CheckCircle2,
  RotateCcw,
  Lock,
  Clock,
} from 'lucide-react-native';
import { z } from 'zod';
import { Screen, Text, Card, Button } from '@/components';
import { apiRequest } from '@/lib/api';
import { colors, radii } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// Attending Inbox — EPA sign-off
//
// Mirrors the web inbox at /src/app/(app)/inbox/page.tsx. This is the one
// screen that's *for attendings/PDs*, not residents. If a resident opens it,
// they get a friendly gate.
//
// Kept deliberately minimal vs. the web version:
//   - No bulk sign-off mode (single-sign-off at launch, add bulk later)
//   - No AI O-score suggest (Pro feature, punted to v2 of the mobile app)
//   - Same backend endpoints — nothing special server-side
//
// Role is fetched from /api/auth/me on mount. No global AuthContext on
// mobile (intentional — each screen owns its fetches for simpler lifecycles).
// ---------------------------------------------------------------------------

const LinkedCaseSchema = z
  .object({
    id: z.string(),
    procedureName: z.string(),
    caseDate: z.string(),
    surgicalApproach: z.string().nullable().optional(),
  })
  .passthrough();

const ResidentSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable().optional(),
  })
  .passthrough();

const ObservationSchema = z
  .object({
    id: z.string(),
    epaId: z.string(),
    epaTitle: z.string(),
    observationDate: z.string(),
    setting: z.string().nullable().optional(),
    complexity: z.string().nullable().optional(),
    entrustmentScore: z.number().nullable().optional(),
    achievement: z.string().optional(),
    observationNotes: z.string().nullable().optional(),
    status: z.string(),
    user: ResidentSchema,
    caseLog: LinkedCaseSchema.nullable().optional(),
  })
  .passthrough();

const InboxResponseSchema = z.object({
  pending: z.array(ObservationSchema),
  recent: z.array(ObservationSchema),
});

const ProfileResponseSchema = z
  .object({
    profile: z
      .object({
        roleType: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

type Observation = z.infer<typeof ObservationSchema>;

const ENTRUSTMENT_LABELS: Record<number, string> = {
  1: 'Had to do',
  2: 'Talk through',
  3: 'Prompted',
  4: 'Just in case',
  5: 'Independent',
};
const ENTRUSTMENT_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#10b981',
};

const STAFF_ROLES = new Set(['ATTENDING', 'STAFF', 'PROGRAM_DIRECTOR']);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function InboxScreen() {
  // Profile role fetch — stored in local state since there's no global context.
  const [roleType, setRoleType] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<Observation[]>([]);
  const [recent, setRecent] = useState<Observation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Fetch the role once, cheaply. If it fails we treat as non-staff
  // (safe default — residents get the gate screen).
  useEffect(() => {
    let cancelled = false;
    apiRequest({
      path: '/api/auth/me',
      method: 'GET',
      schema: ProfileResponseSchema,
    })
      .then((data) => {
        if (cancelled) return;
        setRoleType(data.profile?.roleType ?? null);
      })
      .catch(() => {
        if (!cancelled) setRoleType(null);
      })
      .finally(() => {
        if (!cancelled) setRoleChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStaff = !!(roleType && STAFF_ROLES.has(roleType));

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isStaff) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await apiRequest({
          path: '/api/attending/inbox',
          method: 'GET',
          schema: InboxResponseSchema,
        });
        setPending(data.pending);
        setRecent(data.recent);
      } catch (err) {
        console.warn('[inbox] load failed:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isStaff],
  );

  useEffect(() => {
    if (roleChecked) void load();
  }, [roleChecked, load]);

  // ── Role check in-flight → spinner ─────────────────────────────────────
  if (!roleChecked) {
    return (
      <Screen>
        <View style={{ paddingVertical: 80, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  // ── Role-gate: residents don't belong here ─────────────────────────────
  if (!isStaff) {
    return (
      <Screen>
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 72,
            paddingHorizontal: 20,
          }}
        >
          <Lock
            size={32}
            strokeWidth={1.25}
            color={colors.text3}
            style={{ marginBottom: 14 }}
          />
          <Text variant="body" weight="600" style={{ marginBottom: 6 }}>
            Inbox is for attendings
          </Text>
          <Text
            variant="caption"
            tone="subtle"
            style={{ textAlign: 'center', lineHeight: 20 }}
          >
            This tab is where attendings and program directors review EPA
            sign-offs from their residents.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Inbox size={20} color={colors.text} />
        <Text variant="h1">Sign-Offs</Text>
        {pending.length > 0 && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          >
            <Text
              variant="caption"
              weight="700"
              style={{ color: '#ffffff', fontSize: 11 }}
            >
              {pending.length} pending
            </Text>
          </View>
        )}
      </View>

      <Text
        variant="caption"
        tone="subtle"
        style={{ marginBottom: 20, lineHeight: 20 }}
      >
        EPAs your residents sent you. Tap to review, set the O-score, and sign.
      </Text>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : pending.length === 0 && recent.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 56,
            paddingHorizontal: 20,
          }}
        >
          <CheckCircle2
            size={32}
            strokeWidth={1.25}
            color={colors.success}
            style={{ marginBottom: 12 }}
          />
          <Text variant="body" weight="600" style={{ marginBottom: 4 }}>
            You&apos;re all caught up
          </Text>
          <Text
            variant="caption"
            tone="subtle"
            style={{ textAlign: 'center' }}
          >
            No pending sign-offs. Pull to refresh.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        >
          {pending.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label={`Pending (${pending.length})`} />
              <View style={{ gap: 8 }}>
                {pending.map((obs) => (
                  <ObservationCard
                    key={obs.id}
                    obs={obs}
                    expanded={expanded === obs.id}
                    submitting={submitting === obs.id}
                    onToggle={() =>
                      setExpanded(expanded === obs.id ? null : obs.id)
                    }
                    onAct={async (action, payload) => {
                      setSubmitting(obs.id);
                      try {
                        await apiRequest({
                          path: `/api/attending/observations/${obs.id}`,
                          method: 'POST',
                          body: { action, ...payload },
                          schema: z.unknown(),
                        });
                        setExpanded(null);
                        await load();
                      } catch (err) {
                        Alert.alert(
                          'Action failed',
                          err instanceof Error ? err.message : String(err),
                        );
                      } finally {
                        setSubmitting(null);
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {recent.length > 0 && (
            <View>
              <SectionHeader label="Recently signed" />
              <View style={{ gap: 6 }}>
                {recent.map((obs) => (
                  <RecentRow key={obs.id} obs={obs} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

// ─── Section header ────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <Text
      variant="label"
      tone="muted"
      uppercase
      style={{ marginBottom: 12, letterSpacing: 1 }}
    >
      {label}
    </Text>
  );
}

// ─── Observation card ──────────────────────────────────────────────────

interface CardProps {
  obs: Observation;
  expanded: boolean;
  submitting: boolean;
  onToggle: () => void;
  onAct: (
    action: 'sign' | 'return',
    payload: Record<string, unknown>,
  ) => void;
}

function ObservationCard({
  obs,
  expanded,
  submitting,
  onToggle,
  onAct,
}: CardProps) {
  const [score, setScore] = useState<number | null>(obs.entrustmentScore ?? null);
  const [achievement, setAchievement] = useState<'NOT_ACHIEVED' | 'ACHIEVED'>(
    (obs.achievement as 'NOT_ACHIEVED' | 'ACHIEVED') ?? 'ACHIEVED',
  );
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const handleSign = () => {
    if (!score) {
      Alert.alert('Pick a score', 'Select an entrustment score (O-score) to sign.');
      return;
    }
    onAct('sign', { entrustmentScore: score, achievement });
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      Alert.alert('Add a reason', 'Tell the resident why you are returning this.');
      return;
    }
    onAct('return', { returnedReason: returnReason.trim() });
  };

  return (
    <Card variant="elevated" padding={0} style={{ overflow: 'hidden' }}>
      <Pressable onPress={onToggle} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(59,130,246,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stethoscope size={16} color="#3b82f6" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(14,165,233,0.12)',
                }}
              >
                <Text
                  variant="caption"
                  mono
                  weight="700"
                  style={{ color: '#0ea5e9', fontSize: 10 }}
                >
                  {obs.epaId}
                </Text>
              </View>
              <Text
                variant="body"
                weight="600"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {obs.epaTitle}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
                flexWrap: 'wrap',
              }}
            >
              <Text variant="caption" tone="subtle">
                {obs.user.name || obs.user.email}
              </Text>
              {obs.caseLog ? (
                <>
                  <Text variant="caption" tone="muted">·</Text>
                  <Text variant="caption" tone="subtle">
                    {obs.caseLog.procedureName}
                  </Text>
                </>
              ) : null}
              <Text variant="caption" tone="muted">·</Text>
              <Clock size={10} color={colors.text3} />
              <Text variant="caption" tone="subtle">
                {formatDate(obs.observationDate)}
              </Text>
            </View>
          </View>
          {obs.entrustmentScore ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="caption" tone="subtle" mono style={{ fontSize: 10 }}>
                Self: {obs.entrustmentScore}/5
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <View
          style={{
            padding: 14,
            paddingTop: 0,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {obs.observationNotes ? (
            <View style={{ marginTop: 14, marginBottom: 16 }}>
              <Text
                variant="label"
                tone="muted"
                uppercase
                style={{ marginBottom: 6 }}
              >
                Resident notes
              </Text>
              <Text variant="caption" tone="subtle" style={{ lineHeight: 18 }}>
                {obs.observationNotes}
              </Text>
            </View>
          ) : null}

          {returnOpen ? (
            <View style={{ marginTop: 14 }}>
              <Text
                variant="label"
                tone="muted"
                uppercase
                style={{ marginBottom: 8 }}
              >
                Reason for returning
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.borderMid,
                  padding: 10,
                  minHeight: 80,
                }}
              >
                <TextInput
                  value={returnReason}
                  onChangeText={setReturnReason}
                  placeholder="Shared with the resident so they can revise."
                  placeholderTextColor={colors.text3}
                  multiline
                  style={{
                    color: colors.text,
                    fontFamily: 'Geist',
                    fontSize: 14,
                    lineHeight: 20,
                    minHeight: 60,
                    padding: 0,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 12,
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setReturnOpen(false);
                    setReturnReason('');
                  }}
                  disabled={submitting}
                />
                <Button
                  title={submitting ? 'Returning…' : 'Send back'}
                  variant="primary"
                  size="sm"
                  onPress={handleReturn}
                  loading={submitting}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={{ marginTop: 14 }}>
                <Text
                  variant="label"
                  tone="muted"
                  uppercase
                  style={{ marginBottom: 8 }}
                >
                  Entrustment score
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = score === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => setScore(n)}
                        style={{
                          flex: 1,
                          minWidth: 52,
                          padding: 8,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: selected
                            ? ENTRUSTMENT_COLORS[n]
                            : colors.borderMid,
                          backgroundColor: selected
                            ? `${ENTRUSTMENT_COLORS[n]}22`
                            : colors.surface,
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Text
                          variant="body"
                          weight="700"
                          style={{
                            color: selected
                              ? ENTRUSTMENT_COLORS[n]
                              : colors.text2,
                            fontSize: 14,
                          }}
                        >
                          {n}
                        </Text>
                        <Text
                          variant="caption"
                          style={{
                            color: selected
                              ? ENTRUSTMENT_COLORS[n]
                              : colors.text3,
                            fontSize: 9,
                          }}
                        >
                          {ENTRUSTMENT_LABELS[n]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text
                  variant="label"
                  tone="muted"
                  uppercase
                  style={{ marginBottom: 8 }}
                >
                  Achievement
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['ACHIEVED', 'NOT_ACHIEVED'] as const).map((v) => {
                    const selected = achievement === v;
                    const c = v === 'ACHIEVED' ? '#10b981' : '#94a3b8';
                    return (
                      <Pressable
                        key={v}
                        onPress={() => setAchievement(v)}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: selected ? c : colors.borderMid,
                          backgroundColor: selected
                            ? `${c}22`
                            : colors.surface,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          variant="caption"
                          weight="600"
                          style={{ color: selected ? c : colors.text2 }}
                        >
                          {v === 'ACHIEVED' ? 'Achieved' : 'Not yet'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 18,
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  title="Return"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setReturnOpen(true);
                    setReturnReason('');
                  }}
                  leadingIcon={<RotateCcw size={13} color={colors.text2} />}
                  disabled={submitting}
                />
                <Button
                  title={submitting ? 'Signing…' : 'Sign off'}
                  variant="primary"
                  size="sm"
                  onPress={handleSign}
                  loading={submitting}
                  disabled={!score || submitting}
                  leadingIcon={<CheckCircle2 size={13} color="#ffffff" />}
                />
              </View>
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

// ─── Recently signed (compact row) ────────────────────────────────────

function RecentRow({ obs }: { obs: Observation }) {
  const isSigned = obs.status === 'SIGNED';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: colors.bg1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          flex: 1,
        }}
      >
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 3,
            backgroundColor: isSigned
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(245,158,11,0.15)',
          }}
        >
          <Text
            variant="caption"
            weight="700"
            mono
            style={{
              color: isSigned ? '#22c55e' : '#f59e0b',
              fontSize: 9,
            }}
          >
            {isSigned ? 'Signed' : 'Returned'}
          </Text>
        </View>
        <Text variant="caption" weight="500" numberOfLines={1}>
          {obs.epaId} · {obs.user.name || obs.user.email}
        </Text>
      </View>
      <Text variant="caption" tone="subtle" style={{ fontSize: 11 }}>
        {formatDate(obs.observationDate)}
      </Text>
    </View>
  );
}
