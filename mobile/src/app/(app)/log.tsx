import { useEffect, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Mic, Sparkles } from 'lucide-react-native';
import { Screen, Text, Input, Button, ChipGroup, Card, VoiceLogSheet, type NormalizedVoiceFields } from '@/components';
import { EpaSuggestionSheet } from '@/components/EpaSuggestionSheet';
import { createCase } from '@/lib/cases';
import { suggestEpas } from '@/lib/epa';
import { colors, radii } from '@/theme/tokens';
import {
  AUTONOMY_LEVELS,
  SURGICAL_APPROACHES,
  OUTCOME_CATEGORIES,
  SURGEON_ROLES,
  ageToBin,
  type AutonomyLevel,
  type SurgicalApproach,
  type OutcomeCategory,
  type SurgeonRole,
} from '@hippo/shared/enums';
import type { EpaSuggestion } from '@hippo/shared/schemas/epa';

// Friendly labels for the enum codes. Matches the web `QuickAddModal`
// labeling — residents see "Supervisor in room", server sees the
// canonical enum value `SUPERVISOR_PRESENT`.
const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  OBSERVER: 'Observer',
  ASSISTANT: 'Assistant',
  SUPERVISOR_PRESENT: 'Supervisor in room',
  INDEPENDENT: 'Independent',
  TEACHING: 'Teaching',
};
const APPROACH_LABELS: Record<SurgicalApproach, string> = {
  OPEN: 'Open',
  LAPAROSCOPIC: 'Lap',
  ROBOTIC: 'Robotic',
  ENDOSCOPIC: 'Endo',
  HYBRID: 'Hybrid',
  PERCUTANEOUS: 'Perc',
  OTHER: 'Other',
};
const OUTCOME_LABELS: Record<OutcomeCategory, string> = {
  UNCOMPLICATED: 'Uncomplicated',
  MINOR_COMPLICATION: 'Minor',
  MAJOR_COMPLICATION: 'Major',
  REOPERATION: 'Reop',
  DEATH: 'Death',
  UNKNOWN: 'Unknown',
};

interface FormState {
  procedureName: string;
  role: SurgeonRole;
  autonomyLevel: AutonomyLevel;
  surgicalApproach: SurgicalApproach;
  difficultyScore: number;
  operativeDurationMinutes: string;
  attendingLabel: string;
  diagnosisCategory: string;
  patientAge: string;
  outcomeCategory: OutcomeCategory;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  procedureName: '',
  role: 'First Surgeon',
  autonomyLevel: 'SUPERVISOR_PRESENT',
  surgicalApproach: 'LAPAROSCOPIC',
  difficultyScore: 3,
  operativeDurationMinutes: '',
  attendingLabel: '',
  diagnosisCategory: '',
  patientAge: '',
  outcomeCategory: 'UNCOMPLICATED',
  notes: '',
};

/**
 * Log-a-case form. Mirrors QuickAddModal.tsx on web — same fields,
 * same validation (shared CaseCreateSchema), same EPA-suggest flow
 * post-save. On native we use chip groups instead of `<select>`s
 * because they're faster to operate one-handed.
 */
export default function LogScreen() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);

  const [epaSheetOpen, setEpaSheetOpen] = useState(false);
  const [epaLoading, setEpaLoading] = useState(false);
  const [epaSuggestions, setEpaSuggestions] = useState<EpaSuggestion[]>([]);
  const [epaNote, setEpaNote] = useState<string | null>(null);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voicePrefilled, setVoicePrefilled] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Merge voice-parsed fields into the form. Only sets a field when the
  // parser returned a confident value — we never wipe an existing field
  // the resident already typed.
  const applyVoiceFields = (v: NormalizedVoiceFields) => {
    setForm((f) => ({
      ...f,
      procedureName: v.procedureName ?? f.procedureName,
      surgicalApproach: v.surgicalApproach ?? f.surgicalApproach,
      role: (v.role as FormState['role']) ?? f.role,
      autonomyLevel: v.autonomyLevel ?? f.autonomyLevel,
      attendingLabel: v.attendingLabel ?? f.attendingLabel,
      operativeDurationMinutes:
        v.operativeDurationMinutes != null
          ? String(v.operativeDurationMinutes)
          : f.operativeDurationMinutes,
      outcomeCategory: v.outcomeCategory ?? f.outcomeCategory,
      notes: v.notes ?? f.notes,
    }));
    setVoicePrefilled(true);
  };

  // Accept parsed voice fields passed in from the dashboard's mic button.
  // The dashboard stringifies NormalizedVoiceFields into the `voice` URL
  // param; we parse + apply once per navigation. Expo-router re-uses the
  // screen instance, so this effect keys on params.voice to re-run when
  // the resident runs voice log again from the dashboard.
  const params = useLocalSearchParams<{ voice?: string }>();
  useEffect(() => {
    if (!params.voice) return;
    try {
      const parsed = JSON.parse(params.voice) as NormalizedVoiceFields;
      applyVoiceFields(parsed);
    } catch {
      // Malformed param — ignore silently rather than crashing the screen.
    }
    // Intentionally only runs when the voice param changes — applyVoiceFields
    // is a stable closure inside this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.voice]);

  const runEpaSuggest = async (caseLogId: string | null) => {
    setEpaLoading(true);
    setEpaSuggestions([]);
    setEpaNote(null);
    setEpaSheetOpen(true);
    try {
      const parsedAge = form.patientAge.trim() ? Number.parseInt(form.patientAge, 10) : null;
      const resp = await suggestEpas(
        caseLogId
          ? { caseLogId }
          : {
              caseDetails: {
                procedureName: form.procedureName.trim(),
                surgicalApproach: form.surgicalApproach,
                role: form.role,
                autonomyLevel: form.autonomyLevel,
                difficultyScore: form.difficultyScore,
                diagnosisCategory: form.diagnosisCategory.trim() || null,
                attendingLabel: form.attendingLabel.trim() || null,
                outcomeCategory: form.outcomeCategory,
                notes: form.notes.trim() || null,
                specialtyId: null,
              },
            },
      );
      setEpaSuggestions(resp.suggestions);
      setEpaNote(resp.note ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load EPA suggestions.';
      setEpaNote(msg);
    } finally {
      setEpaLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!form.procedureName.trim()) {
      Alert.alert('Missing procedure', 'Enter a procedure name to log this case.');
      return;
    }
    setSaving(true);
    try {
      const parsedAge = form.patientAge.trim() ? Number.parseInt(form.patientAge, 10) : null;
      const parsedDuration = form.operativeDurationMinutes.trim()
        ? Number.parseInt(form.operativeDurationMinutes, 10)
        : null;

      const created = await createCase({
        procedureName: form.procedureName.trim(),
        role: form.role,
        autonomyLevel: form.autonomyLevel,
        surgicalApproach: form.surgicalApproach,
        difficultyScore: form.difficultyScore,
        operativeDurationMinutes: parsedDuration,
        attendingLabel: form.attendingLabel.trim() || null,
        diagnosisCategory: form.diagnosisCategory.trim() || null,
        patientAgeBin: ageToBin(parsedAge),
        outcomeCategory: form.outcomeCategory,
        notes: form.notes.trim() || null,
        caseDate: new Date().toISOString(),
      });
      setSavedCaseId(created.id);
      // Fire EPA suggest with the saved ID (server can re-read profile
      // specialty + existing observations). Doesn't block form reset.
      void runEpaSuggest(created.id);
      // Reset fields that are specific to a single case; keep role +
      // attending in memory (residents log back-to-back cases with
      // the same attending in a single OR day).
      setForm((f) => ({
        ...DEFAULT_FORM,
        role: f.role,
        attendingLabel: f.attendingLabel,
        surgicalApproach: f.surgicalApproach,
        autonomyLevel: f.autonomyLevel,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save case.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const difficultyOpts: readonly ('1' | '2' | '3' | '4' | '5')[] = ['1', '2', '3', '4', '5'] as const;

  return (
    <>
      <Screen>
        <View style={{ gap: 4, marginBottom: 20 }}>
          <Text variant="label" tone="subtle" uppercase>
            New case
          </Text>
          <Text variant="h1">Log a case</Text>
        </View>

        {/* Voice quick-log CTA — the hero mobile-native flow. */}
        <Pressable
          onPress={() => setVoiceOpen(true)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            marginBottom: 16,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderGlow,
            backgroundColor: colors.primaryDim,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryGlow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mic size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="body" weight="600">
                Voice log
              </Text>
              <Sparkles size={11} color={colors.primary} />
            </View>
            <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
              Tap, say one sentence, review the form. ~10 seconds.
            </Text>
          </View>
        </Pressable>

        {voicePrefilled ? (
          <Card variant="elevated" style={{ marginBottom: 12 }}>
            <Text variant="caption" tone="success" weight="600">
              Prefilled from your voice log. Review below and save.
            </Text>
          </Card>
        ) : null}

        {savedCaseId ? (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text variant="caption" tone="success" weight="600">
              Case saved. EPA suggestions are loading.
            </Text>
          </Card>
        ) : null}

        <View style={{ gap: 16 }}>
          <Input
            label="Procedure"
            value={form.procedureName}
            onChangeText={(t) => set('procedureName', t)}
            placeholder="e.g. Laparoscopic cholecystectomy"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <View>
            <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
              Role
            </Text>
            <ChipGroup options={SURGEON_ROLES} value={form.role} onChange={(v) => set('role', v)} />
          </View>

          <View>
            <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
              Autonomy
            </Text>
            <ChipGroup
              options={AUTONOMY_LEVELS}
              labelFor={(v) => AUTONOMY_LABELS[v]}
              value={form.autonomyLevel}
              onChange={(v) => set('autonomyLevel', v)}
            />
          </View>

          <View>
            <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
              Approach
            </Text>
            <ChipGroup
              options={SURGICAL_APPROACHES}
              labelFor={(v) => APPROACH_LABELS[v]}
              value={form.surgicalApproach}
              onChange={(v) => set('surgicalApproach', v)}
            />
          </View>

          <View>
            <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
              Difficulty (1 easy – 5 hard)
            </Text>
            <ChipGroup
              options={difficultyOpts}
              value={String(form.difficultyScore) as '1' | '2' | '3' | '4' | '5'}
              onChange={(v) => set('difficultyScore', Number.parseInt(v, 10))}
            />
          </View>

          <Input
            label="OR time (minutes)"
            value={form.operativeDurationMinutes}
            onChangeText={(t) => set('operativeDurationMinutes', t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="e.g. 95"
          />

          <Input
            label="Attending"
            value={form.attendingLabel}
            onChangeText={(t) => set('attendingLabel', t)}
            placeholder="Dr. Naks"
            autoCapitalize="words"
          />

          <Input
            label="Diagnosis"
            value={form.diagnosisCategory}
            onChangeText={(t) => set('diagnosisCategory', t)}
            placeholder="e.g. Cholelithiasis"
            autoCapitalize="sentences"
          />

          <Input
            label="Patient age"
            value={form.patientAge}
            onChangeText={(t) => set('patientAge', t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="e.g. 54"
            hint="Age bins are stored — the exact number is not persisted."
          />

          <View>
            <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
              Outcome
            </Text>
            <ChipGroup
              options={OUTCOME_CATEGORIES}
              labelFor={(v) => OUTCOME_LABELS[v]}
              value={form.outcomeCategory}
              onChange={(v) => set('outcomeCategory', v)}
            />
          </View>

          <Input
            label="Notes"
            value={form.notes}
            onChangeText={(t) => set('notes', t)}
            placeholder="Teaching points, key steps, anatomy notes…"
            multiline
            numberOfLines={4}
            style={{ minHeight: 96, paddingTop: 12 }}
            hint="Never include identifying information (names, MRN, dates)."
          />

          <Button
            title={saving ? 'Saving…' : 'Save case'}
            onPress={onSubmit}
            loading={saving}
            fullWidth
            size="lg"
            style={{ marginTop: 4 }}
          />

          {savedCaseId ? (
            <Button
              title="See EPA suggestions"
              variant="secondary"
              onPress={() => runEpaSuggest(savedCaseId)}
              fullWidth
            />
          ) : null}
        </View>
      </Screen>

      <EpaSuggestionSheet
        visible={epaSheetOpen}
        loading={epaLoading}
        suggestions={epaSuggestions}
        note={epaNote}
        onClose={() => setEpaSheetOpen(false)}
      />

      <VoiceLogSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onFieldsReady={applyVoiceFields}
      />
    </>
  );
}
