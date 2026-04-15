import type { ReactNode } from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'mono';
type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'danger' | 'success';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: '400' | '500' | '600' | '700';
  uppercase?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<Variant, TextStyle> = {
  h1: { fontSize: typography.fontSize.xxl, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: typography.fontSize.xl, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: typography.fontSize.lg, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: typography.fontSize.base, fontWeight: '400' },
  caption: { fontSize: typography.fontSize.sm, fontWeight: '400' },
  label: { fontSize: typography.fontSize.sm, fontWeight: '500', letterSpacing: 0.3 },
  mono: { fontSize: typography.fontSize.sm, fontFamily: 'Menlo' },
};

const toneColors: Record<Tone, string> = {
  default: colors.text,
  muted: colors.text2,
  subtle: colors.text3,
  primary: colors.primary,
  danger: colors.danger,
  success: colors.success,
};

/**
 * Typographic primitive. One place to tweak the scale, one set of
 * tones, one way to enforce we never fall back to RN's platform-
 * default font. Matches the variants in the web app's design system.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  uppercase,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      {...rest}
      style={[
        {
          color: toneColors[tone],
          fontFamily: 'Geist',
          ...variantStyles[variant],
        },
        weight ? { fontWeight: weight } : null,
        uppercase ? { textTransform: 'uppercase', letterSpacing: 0.8 } : null,
        style,
      ]}
    />
  );
}
