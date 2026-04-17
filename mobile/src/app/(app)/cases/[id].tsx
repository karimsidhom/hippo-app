import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2, ExternalLink } from 'lucide-react-native';
import { z } from 'zod';
import { Screen, Text, Card, Button } from '@/components';
import { apiRequest } from '@/lib/api';
import { colors, radii } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// Case detail — read-only for now. The full edit-in-place experience still
// lives on the web (hippomedicine.com/cases → expand → edit), which we
// deep-link out to from the "Edit on web" action at the bottom.
//
// This keeps the mobile app focused on the fast paths: log, list, skim.
// Heavier workflows (dictation drawer, debrief, pearl share) intentionally
// stay web-only in v1 — we'll port them once the voice-log flow proves
// out the mobile UX for long-form content.
// ---------------------------------------------------------------------------

// Loose schema — Prisma has 30+ columns on CaseLog and we only render a
// subset here. `.passthrough()` means unknown fields pass through without
// throwing, so the web can add columns without breaking the app until the
// next EAS build.
const CaseDetailSchema = z
  .object({
    id: z.string(),
    procedureName: z.string(),
    procedureCategory: z.string().nullable().optional(),
    specialtyId: z.string().nullable().optional(),
    specialtyName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    autonomyLevel: z.string().nullable().optional(),
    surgicalApproach: z.string().nullable().optional(),
    operativeDurationMinutes: z.number().nullable().optional(),
    consoleTimeMinutes: z.number().nullable().optional(),
    dockingTimeMinutes: z.number().nullable().optional(),
    difficultyScore: z.number().nullable().optional(),
    outcomeCategory: z.string().nullable().optional(),
    complicationCategory: z.string().nullable().optional(),
    attendingLabel: z.string().nullable().optional(),
    institutionSite: z.string().nullable().optional(),
    diagnosisCategory: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    reflection: z.string().nullable().optional(),
    caseDate: z.string(),
  })
  .passthrough();

type CaseDetail = z.infer<typeof CaseDetailSchema>;

const AUTONOMY_LABELS: Record<string, string> = {
  OBSERVER: 'Observer',
  ASSISTANT: 'Assistant',
  SUPERVISOR_PRESENT: 'Supervisor Present',
  INDEPENDENT: 'Independent',
  TEACHING: 'Teaching',
};
const APPROACH_LABELS: Record<string, string> = {
  OPEN: 'Open',
  LAPAROSCOPIC: 'Laparoscopic',
  ROBOTIC: 'Robotic',
  ENDOSCOPIC: 'Endoscopic',
  HYBRID: 'Hybrid',
  PERCUTANEOUS: 'Percutaneous',
  OTHER: 'Other',
};
const OUTCOME_LABELS: Record<string, string> = {
  UNCOMPLICATED: 'Uncomplicated',
  MINOR_COMPLICATION: 'Minor complication',
  MAJOR_COMPLICATION: 'Major complication',
  REOPERATION: 'Reoperation',
  DEATH: 'Death',
  UNKNOWN: 'Unknown',
};

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function label(v: string | null | undefined, lookup?: Record<string, string>): string | null {
  if (!v) return null;
  const k = v.toUpperCase();
  return lookup?.[k] ?? v;
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    apiRequest({
      path: `/api/cases/${id}`,
      method: 'GET',
      schema: CaseDetailSchema,
    })
      .then((c) => {
        if (!cancelled) setData(c);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete this case?',
      'This removes it from your logbook permanently. You can\u2019t undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiRequest({
                path: `/api/cases/${id}`,
                method: 'DELETE',
                schema: z.unknown(),
              });
              router.back();
            } catch (err) {
              Alert.alert('Could not delete', err instanceof Error ? err.message : 'Unknown error');
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      {/* Header row with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.sm,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} color={colors.text2} />
        </Pressable>
        <Text variant="label" tone="subtle" uppercase>
          Case
        </Text>
      </View>

      {error ? (
        <Card>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </Card>
      ) : !data ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 18 }}>
            <Text variant="h2" numberOfLines={3}>
              {data.procedureName}
            </Text>
            <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
              {formatDateLong(data.caseDate)}
              {data.attendingLabel ? ` · ${data.attendingLabel}` : ''}
            </Text>
          </View>

          {/* Key facts */}
          <Card variant="elevated" padding={16} style={{ marginBottom: 12 }}>
            <Row label="Specialty" value={data.specialtyName ?? data.specialtyId} />
            <Row label="Role" value={data.role} />
            <Row label="Autonomy" value={label(data.autonomyLevel, AUTONOMY_LABELS)} />
            <Row label="Approach" value={label(data.surgicalApproach, APPROACH_LABELS)} />
            <Row
              label="OR duration"
              value={data.operativeDurationMinutes ? `${data.operativeDurationMinutes} min` : null}
            />
            {data.consoleTimeMinutes ? (
              <Row label="Console time" value={`${data.consoleTimeMinutes} min`} />
            ) : null}
            {data.dockingTimeMinutes ? (
              <Row label="Docking time" value={`${data.dockingTimeMinutes} min`} />
            ) : null}
            <Row
              label="Difficulty"
              value={data.difficultyScore ? `${data.difficultyScore} / 5` : null}
            />
            <Row
              label="Outcome"
              value={label(data.outcomeCategory, OUTCOME_LABELS)}
            />
            <Row
              label="Complication"
              value={
                data.complicationCategory === 'NONE' ? 'None' : data.complicationCategory ?? null
              }
            />
            <Row label="Diagnosis" value={data.diagnosisCategory} />
            <Row label="Site" value={data.institutionSite} isLast />
          </Card>

          {data.notes ? (
            <Card variant="glass" padding={14} style={{ marginBottom: 12 }}>
              <Text variant="label" tone="subtle" uppercase style={{ marginBottom: 6 }}>
                Notes
              </Text>
              <Text variant="body" tone="subtle" style={{ lineHeight: 21 }}>
                {data.notes}
              </Text>
            </Card>
          ) : null}

          {data.reflection ? (
            <Card variant="glass" padding={14} style={{ marginBottom: 12 }}>
              <Text variant="label" tone="subtle" uppercase style={{ marginBottom: 6 }}>
                Reflection
              </Text>
              <Text variant="body" tone="subtle" style={{ lineHeight: 21 }}>
                {data.reflection}
              </Text>
            </Card>
          ) : null}

          <View style={{ marginTop: 18, gap: 10 }}>
            <Button
              title="Edit on web"
              variant="secondary"
              onPress={() => {
                // Deep link out for edits — the full edit flow (dictation,
                // debrief, pearl share) still lives on hippomedicine.com.
                void import('expo-web-browser').then(({ openBrowserAsync }) =>
                  openBrowserAsync(`https://hippomedicine.com/cases?case=${data.id}`),
                );
              }}
              leadingIcon={<ExternalLink size={14} color={colors.text2} />}
              fullWidth
            />
            <Button
              title={deleting ? 'Deleting\u2026' : 'Delete case'}
              variant="danger"
              onPress={onDelete}
              loading={deleting}
              leadingIcon={!deleting ? <Trash2 size={14} color="#ffffff" /> : undefined}
              fullWidth
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function Row({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string | null | undefined;
  isLast?: boolean;
}) {
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : StyleSheet_hairline,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <Text variant="caption" tone="muted" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="body" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

// StyleSheet.hairlineWidth can't be imported inline into a literal; pull
// a compile-time constant instead. RN resolves this to `0.33` on @3x iOS.
const StyleSheet_hairline = 0.5;
