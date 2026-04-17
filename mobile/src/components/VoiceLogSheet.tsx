import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Mic, X, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Text, Button } from './index';
import { useVoiceRecognition } from '@/lib/voice';
import {
  parseVoiceTranscript,
  coerceApproach,
  coerceAutonomy,
  coerceOutcome,
  type ParsedCaseFields,
} from '@/lib/voiceLog';
import type {
  AutonomyLevel,
  OutcomeCategory,
  SurgicalApproach,
} from '@hippo/shared/enums';
import { colors, radii } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// VoiceLogSheet — the hero mobile flow.
//
// Three states inside a single bottom sheet:
//
//   1. Listening — the user is speaking into the mic. We show a big pulsing
//      circle, a live transcript, and Stop / Cancel buttons.
//   2. Parsing — transcript sent to /api/voice-log, waiting on Claude.
//   3. Review — parsed fields rendered as a chip list. The user taps
//      "Use these fields" and we hand them back to the log form for a
//      final visual confirmation before saving. We never save from here
//      directly — the resident always reviews on a structured form.
//
// Design intent: this is a VERY fast interaction. A resident walks out of
// the OR, opens the app, taps the mic, says one sentence, and has a
// prefilled form in <10 seconds. Everything else gets out of the way.
// ---------------------------------------------------------------------------

export interface VoiceLogSheetProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Called with the parsed fields when the user confirms. The caller is
   * expected to route these fields into its existing log form for final
   * review. We don't save on the user's behalf — voice is always a draft
   * intake, never a terminal step.
   */
  onFieldsReady: (fields: NormalizedVoiceFields) => void;
}

/**
 * The form-ready shape — enums normalized, strings trimmed. The raw LLM
 * output (ParsedCaseFields) has `string` enums that still need coercion;
 * we do that work once here and hand the caller typed values.
 */
export interface NormalizedVoiceFields {
  procedureName?: string;
  surgicalApproach?: SurgicalApproach;
  role?: string;
  autonomyLevel?: AutonomyLevel;
  attendingLabel?: string;
  operativeDurationMinutes?: number;
  outcomeCategory?: OutcomeCategory;
  notes?: string;
}

function normalize(fields: ParsedCaseFields): NormalizedVoiceFields {
  return {
    procedureName: fields.procedureName?.trim() || undefined,
    surgicalApproach: coerceApproach(fields.surgicalApproach),
    role: fields.role?.trim() || undefined,
    autonomyLevel: coerceAutonomy(fields.autonomyLevel),
    attendingLabel: fields.attendingLabel?.trim() || undefined,
    operativeDurationMinutes:
      typeof fields.operativeDurationMinutes === 'number' &&
      fields.operativeDurationMinutes > 0
        ? Math.round(fields.operativeDurationMinutes)
        : undefined,
    outcomeCategory: coerceOutcome(fields.outcomeCategory),
    notes: fields.notes?.trim() || undefined,
  };
}

export function VoiceLogSheet({ visible, onClose, onFieldsReady }: VoiceLogSheetProps) {
  const voice = useVoiceRecognition();
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<NormalizedVoiceFields | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Reset all transient state whenever the sheet opens. Keeps each voice
  // session clean — no stale transcript from a prior open.
  useEffect(() => {
    if (visible) {
      setParsed(null);
      setParseError(null);
      setParsing(false);
      voice.reset();
    } else {
      voice.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Kick off listening immediately on open — the mic button in the header
  // is what brought the user here. Removing a tap shaves ~400ms off the
  // "walked out of OR → first word heard" latency.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      void voice.start();
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleStop = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    voice.stop();
    // Give the speech engine a moment to emit its final `result` event
    // before we grab the transcript. 450ms is generous — iOS typically
    // finalizes within ~200ms of `stop()`.
    setTimeout(() => {
      const text = voice.transcript.trim();
      if (!text) {
        setParseError("I didn't catch anything. Try again.");
        return;
      }
      void runParse(text);
    }, 450);
  };

  const runParse = async (transcript: string) => {
    setParsing(true);
    setParseError(null);
    try {
      const res = await parseVoiceTranscript(transcript);
      if (res.engine === 'unavailable') {
        setParseError(
          "AI parser is temporarily unavailable. Use the manual form instead — your words are still here above.",
        );
        setParsing(false);
        return;
      }
      const normalized = normalize(res.fields);
      setParsed(normalized);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not parse your dictation.';
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  };

  const hasTranscript = voice.transcript.length > 0 || voice.partial.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.78)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            paddingTop: 14,
            paddingBottom: 32,
            paddingHorizontal: 20,
            maxHeight: '94%',
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.borderMid,
              marginBottom: 14,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text variant="label" uppercase style={{ color: colors.primary }}>
                Voice log
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.sm,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} color={colors.text2} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* ── Stage: REVIEW (parsed fields ready) ───────────────────── */}
            {parsed ? (
              <ReviewStage
                transcript={voice.transcript}
                fields={parsed}
                onRedo={() => {
                  setParsed(null);
                  setParseError(null);
                  voice.reset();
                  void voice.start();
                }}
                onUse={() => {
                  onFieldsReady(parsed);
                  onClose();
                }}
              />
            ) : /* ── Stage: PARSING (LLM working) ────────────────────────── */
            parsing ? (
              <ParsingStage transcript={voice.transcript} />
            ) : (
              /* ── Stage: LISTENING (mic hot) ────────────────────────────── */
              <ListeningStage
                isListening={voice.isListening}
                volume={voice.volume}
                transcript={voice.transcript}
                partial={voice.partial}
                error={voice.error ?? parseError}
                onStart={() => {
                  setParseError(null);
                  void voice.start();
                }}
                onStop={handleStop}
                hasTranscript={hasTranscript}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Listening stage ────────────────────────────────────────────────────

function ListeningStage({
  isListening,
  volume,
  transcript,
  partial,
  error,
  onStart,
  onStop,
  hasTranscript,
}: {
  isListening: boolean;
  volume: number;
  transcript: string;
  partial: string;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  hasTranscript: boolean;
}) {
  // Animated pulse ring on the mic button. We tie the scale to both an
  // idle animation (always gently pulsing while listening) and a volume
  // multiplier so the ring reacts to the user's voice.
  const pulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isListening, pulse]);

  const volumeRing = 1 + volume * 0.25;

  return (
    <View>
      <Text variant="h2" style={{ marginBottom: 6 }}>
        {isListening ? 'Listening…' : hasTranscript ? 'Paused' : 'Tap to speak'}
      </Text>
      <Text variant="caption" tone="subtle" style={{ marginBottom: 24, lineHeight: 18 }}>
        Describe the case naturally, as if you were telling a colleague. Procedure,
        role, attending, time, and outcome — we’ll fill in the form for you.
      </Text>

      {/* Mic button + pulse */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          height: 180,
        }}
      >
        {isListening ? (
          <>
            <Animated.View
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: colors.primaryGlow,
                transform: [{ scale: pulse }],
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 130,
                height: 130,
                borderRadius: 65,
                backgroundColor: colors.primaryDim,
                transform: [{ scale: volumeRing }],
              }}
            />
          </>
        ) : null}
        <Pressable
          onPress={isListening ? onStop : onStart}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: isListening ? colors.primary : colors.surface2,
            borderWidth: 1,
            borderColor: isListening ? colors.primary : colors.borderMid,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={12}
        >
          <Mic
            size={36}
            color={isListening ? '#ffffff' : colors.primary}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {/* Live transcript */}
      {hasTranscript ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: 14,
            marginBottom: 18,
            minHeight: 70,
          }}
        >
          <Text
            variant="body"
            tone="default"
            style={{ lineHeight: 21 }}
          >
            {transcript}
            {partial ? (
              <Text variant="body" tone="muted">
                {transcript ? ' ' : ''}
                {partial}
              </Text>
            ) : null}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.25)',
            borderRadius: radii.md,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </View>
      ) : null}

      {/* Action row */}
      {isListening ? (
        <Button
          title="Stop & continue"
          onPress={onStop}
          fullWidth
          size="lg"
          disabled={!hasTranscript}
        />
      ) : hasTranscript ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Tap to resume"
            onPress={onStart}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <Button
            title="Parse now"
            onPress={onStop}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button title="Start" onPress={onStart} fullWidth size="lg" />
      )}
    </View>
  );
}

// ─── Parsing stage ──────────────────────────────────────────────────────

function ParsingStage({ transcript }: { transcript: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 14 }}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text variant="h3">Parsing your case…</Text>
      <Text variant="caption" tone="subtle" style={{ textAlign: 'center', maxWidth: 280 }}>
        Pulling out procedure, role, approach, and outcome. Takes about a second.
      </Text>
      {transcript ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: 14,
            marginTop: 10,
            alignSelf: 'stretch',
          }}
        >
          <Text variant="caption" tone="muted" style={{ lineHeight: 19, fontStyle: 'italic' }}>
            “{transcript}”
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Review stage ───────────────────────────────────────────────────────

function ReviewStage({
  transcript,
  fields,
  onRedo,
  onUse,
}: {
  transcript: string;
  fields: NormalizedVoiceFields;
  onRedo: () => void;
  onUse: () => void;
}) {
  const rows = [
    { label: 'Procedure', value: fields.procedureName },
    { label: 'Approach', value: fields.surgicalApproach },
    { label: 'Role', value: fields.role },
    { label: 'Autonomy', value: fields.autonomyLevel },
    { label: 'Attending', value: fields.attendingLabel },
    {
      label: 'OR time',
      value: fields.operativeDurationMinutes
        ? `${fields.operativeDurationMinutes} min`
        : undefined,
    },
    { label: 'Outcome', value: fields.outcomeCategory },
    { label: 'Notes', value: fields.notes },
  ].filter((r) => !!r.value);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.primaryDim,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={14} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text variant="h3">Here’s what I heard</Text>
      </View>
      <Text
        variant="caption"
        tone="subtle"
        style={{ marginBottom: 18, lineHeight: 18 }}
      >
        Tap “Use these” and you’ll drop into the log form with everything
        prefilled. Nothing’s saved until you review.
      </Text>

      {rows.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.glassMid,
            borderWidth: 1,
            borderColor: colors.borderGlass,
            borderRadius: radii.md,
            padding: 14,
            marginBottom: 12,
            gap: 8,
          }}
        >
          {rows.map((r, i) => (
            <View
              key={r.label}
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingVertical: 4,
                borderBottomWidth: i === rows.length - 1 ? 0 : 0.5,
                borderBottomColor: colors.border,
                paddingBottom: i === rows.length - 1 ? 0 : 8,
              }}
            >
              <Text
                variant="caption"
                tone="muted"
                style={{ width: 80, paddingTop: 2 }}
              >
                {r.label}
              </Text>
              <Text
                variant="body"
                style={{ flex: 1, lineHeight: 20 }}
                numberOfLines={5}
              >
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(245, 158, 11, 0.25)',
            borderRadius: radii.md,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <Text variant="caption" tone="warning" style={{ lineHeight: 18 }}>
            I couldn’t pull structured fields from that. Try again with something like
            “lap chole today with Dr. Chen, I was console surgeon, 90 minutes,
            uncomplicated.”
          </Text>
        </View>
      )}

      {transcript ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <Text
            variant="label"
            tone="muted"
            uppercase
            style={{ marginBottom: 4 }}
          >
            You said
          </Text>
          <Text
            variant="caption"
            tone="subtle"
            style={{ lineHeight: 18, fontStyle: 'italic' }}
          >
            “{transcript}”
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Redo" onPress={onRedo} variant="secondary" style={{ flex: 1 }} />
        <Button
          title="Use these"
          onPress={onUse}
          style={{ flex: 1 }}
          disabled={rows.length === 0}
        />
      </View>
    </View>
  );
}
