import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radii } from '@/theme/tokens';

interface ChipGroupProps<T extends string> {
  options: readonly T[];
  /** Human-facing label for each raw value. Defaults to the value itself. */
  labelFor?: (value: T) => string;
  value: T | null | undefined;
  onChange: (value: T) => void;
  /** Show chips in a horizontal scroll (good for 5+ options); otherwise wraps. */
  scroll?: boolean;
}

/**
 * Inline multi-choice selector. Used for AutonomyLevel, SurgicalApproach,
 * OutcomeCategory, etc. — anywhere the web app uses a `<select>`, the
 * mobile app uses chips because they're faster to operate one-handed in
 * a scrub room than a wheel picker.
 */
export function ChipGroup<T extends string>({
  options,
  labelFor,
  value,
  onChange,
  scroll,
}: ChipGroupProps<T>) {
  const content = options.map((opt) => {
    const active = opt === value;
    return (
      <Pressable
        key={opt}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onChange(opt);
        }}
        style={({ pressed }) => ({
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.borderMid,
          backgroundColor: active
            ? 'rgba(14, 165, 233, 0.12)'
            : pressed
              ? colors.surface2
              : colors.surface,
          minHeight: 36,
          justifyContent: 'center',
        })}
      >
        <Text
          variant="caption"
          tone={active ? 'primary' : 'muted'}
          weight={active ? '600' : '500'}
        >
          {labelFor ? labelFor(opt) : opt}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {content}
      </View>
    );
  }

  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{content}</View>;
}
