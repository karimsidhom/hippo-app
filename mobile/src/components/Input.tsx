import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radii, typography } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

/**
 * Form input matching the web app's `<Input>` component semantics.
 * Always 16pt font-size (the web app caps at 14 on desktop, but here
 * we're native — there's no URL-bar zoom bug, so readability wins).
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, containerStyle, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.text3}
        selectionColor={colors.primary}
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor,
            borderRadius: radii.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.text,
            fontFamily: 'Geist',
            fontSize: typography.inputFontSize,
            minHeight: 44,
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
