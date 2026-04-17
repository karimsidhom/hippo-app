import { Text as RNText, type TextProps, type TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme/tokens';

/**
 * Typographic variants mirror the web hierarchy. Keep the variant set
 * tight — adding a 9th size is almost always a sign the design isn't
 * using the tokens right.
 */
type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'caption'
  | 'label'
  | 'sectionTitle'
  | 'mono';

type Tone =
  | 'default'
  | 'subtle'
  | 'muted'
  | 'faint'
  | 'primary'
  | 'primaryHi'
  | 'success'
  | 'danger'
  | 'warning'
  | 'inverse';

type Weight = '400' | '500' | '600' | '700';

interface Props extends Omit<TextProps, 'style'> {
  variant?: Variant;
  tone?: Tone;
  weight?: Weight;
  uppercase?: boolean;
  mono?: boolean;
  style?: TextProps['style'];
}

const TONE: Record<Tone, string> = {
  default: colors.text,
  subtle: colors.text2,
  muted: colors.text3,
  faint: colors.muted,
  primary: colors.primary,
  primaryHi: colors.primaryHi,
  success: colors.successHi,
  danger: colors.dangerHi,
  warning: colors.warningHi,
  inverse: '#060d13',
};

const FAMILY: Record<Weight, string> = {
  '400': typography.fontFamily.sans,
  '500': typography.fontFamily.sansMedium,
  '600': typography.fontFamily.sansSemibold,
  '700': typography.fontFamily.sansBold,
};

const MONO_FAMILY: Record<Weight, string> = {
  '400': typography.fontFamily.mono,
  '500': typography.fontFamily.monoMedium,
  '600': typography.fontFamily.monoMedium,
  '700': typography.fontFamily.monoMedium,
};

const VARIANT: Record<Variant, TextStyle> = {
  display: {
    fontSize: typography.fontSize.display,
    lineHeight: typography.fontSize.display * 1.05,
    letterSpacing: typography.letterSpacing.tight,
  },
  h1: {
    fontSize: typography.fontSize.xxxl,
    lineHeight: typography.fontSize.xxxl * 1.15,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.fontSize.xxl * 1.2,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * 1.25,
    letterSpacing: typography.letterSpacing.body,
  },
  bodyLg: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * 1.5,
    letterSpacing: typography.letterSpacing.body,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.5,
    letterSpacing: typography.letterSpacing.body,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.45,
  },
  label: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * 1.35,
  },
  // Matches web `.section-title` — 9px, 1.4px tracking, uppercase.
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    letterSpacing: typography.letterSpacing.uppercase,
    textTransform: 'uppercase',
  },
  mono: {
    fontSize: typography.fontSize.sm,
    letterSpacing: 0,
  },
};

/**
 * Text — the foundation of the Hippo typographic system. All screen
 * text should route through here; don't reach for `<RNText>` directly
 * except inside internal primitives that override style entirely.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  uppercase,
  mono,
  style,
  children,
  ...rest
}: Props) {
  const resolvedWeight: Weight =
    weight ??
    (variant === 'sectionTitle' || variant === 'label'
      ? '600'
      : variant.startsWith('h') || variant === 'display'
      ? '600'
      : '400');
  const fam = (mono ? MONO_FAMILY : FAMILY)[resolvedWeight];
  return (
    <RNText
      allowFontScaling={false}
      style={[
        styles.base,
        VARIANT[variant],
        { color: TONE[tone], fontFamily: fam },
        uppercase ? { textTransform: 'uppercase' } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
