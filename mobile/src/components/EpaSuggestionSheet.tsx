import { Modal, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sparkles } from 'lucide-react-native';
import { Text, Card, Button } from './index';
import { colors, radii } from '@/theme/tokens';
import type { EpaSuggestion } from '@hippo/shared/schemas/epa';

interface Props {
  visible: boolean;
  loading: boolean;
  suggestions: EpaSuggestion[];
  note: string | null;
  onClose: () => void;
}

const confidenceColor: Record<EpaSuggestion['confidence'], string> = {
  high: colors.success,
  medium: colors.primary,
  low: colors.text3,
};

/**
 * Bottom-sheet-style modal that surfaces the AI-suggested EPAs after a
 * case is logged. Matches the semantics of EpaSuggestionSheet.tsx on
 * web — Gemini ranks the EPAs by match strength, we show confidence,
 * reasons, and current progress against target.
 */
export function EpaSuggestionSheet({ visible, loading, suggestions, note, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: colors.bg1,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: '85%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles color={colors.primary} size={18} />
              <Text variant="h3">Suggested EPAs</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}
            >
              <X color={colors.text2} size={16} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Card>
                <Text variant="body" tone="muted">
                  Matching this case to your EPAs…
                </Text>
              </Card>
            ) : suggestions.length === 0 ? (
              <Card>
                <Text variant="body" tone="muted">
                  {note ?? 'No EPA suggestions for this case yet.'}
                </Text>
              </Card>
            ) : (
              suggestions.map((s) => {
                const pct =
                  s.currentProgress.targetCount > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (s.currentProgress.observations / s.currentProgress.targetCount) * 100,
                        ),
                      )
                    : 0;
                return (
                  <Card key={s.epaId} variant="elevated">
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="caption" tone="subtle" weight="600">
                          {s.epaId}
                        </Text>
                        <Text variant="body" weight="600" style={{ marginTop: 2 }}>
                          {s.epaTitle}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: radii.full,
                          borderWidth: 1,
                          borderColor: confidenceColor[s.confidence],
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ color: confidenceColor[s.confidence], fontSize: 11 }}
                          weight="600"
                          uppercase
                        >
                          {s.confidence}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 10, gap: 4 }}>
                      {s.matchReasons.slice(0, 3).map((r, i) => (
                        <Text key={i} variant="caption" tone="muted">
                          · {r}
                        </Text>
                      ))}
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text variant="caption" tone="subtle">
                          Progress
                        </Text>
                        <Text variant="caption" tone="muted" weight="500">
                          {s.currentProgress.observations} / {s.currentProgress.targetCount}
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
                            height: '100%',
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}

            {note && !loading ? (
              <Text variant="caption" tone="subtle" style={{ marginTop: 4, textAlign: 'center' }}>
                {note}
              </Text>
            ) : null}
          </ScrollView>

          <View style={{ padding: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button title="Done" onPress={onClose} fullWidth variant="secondary" />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
