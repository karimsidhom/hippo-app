import type { ReactNode } from 'react';
import { View, type ViewStyle, StyleSheet, Platform } from 'react-native';
import { colors, radii, shadows } from '@/theme/tokens';

type Variant = 'glass' | 'elevated' | 'active' | 'flat';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: Variant;
  padding?: number;
}

/**
 * Card — the glass panel vocabulary from the web. Three tiers:
 *
 *   glass      — subtle background tint, hairline border. Default.
 *   elevated   — brighter glass, teal-tinted border, soft shadow.
 *                Use for primary content cards on a page.
 *   active     — focused state (selected, hovered, in-context).
 *                Brightest glass, primary-glow border, larger shadow.
 *   flat       — opaque surface, no glass. For dense data tables or
 *                places where the glass tint would read as noise.
 *
 * All variants include a 1px top highlight via an absolutely-
 * positioned child — this approximates the web's
 * `box-shadow: inset 0 1px 0 rgba(255,255,255,.04)` which React
 * Native doesn't support natively.
 */
export function Card({
  children,
  style,
  variant = 'glass',
  padding = 16,
}: CardProps) {
  const spec = SPEC[variant];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: spec.bg,
          borderColor: spec.border,
          padding,
        },
        spec.shadow,
        style,
      ]}
    >
      {/* Top-edge inset highlight — simulates inset 0 1px 0 rgba(255,255,255,X). */}
      {variant !== 'flat' ? (
        <View pointerEvents="none" style={[styles.topHighlight, { opacity: spec.hi }]} />
      ) : null}
      {children}
    </View>
  );
}

const SPEC = {
  glass: {
    bg: colors.glass,
    border: colors.borderMid,
    hi: 0.04,
    shadow: Platform.OS === 'ios' ? shadows.card : undefined,
  },
  elevated: {
    bg: colors.glassMid,
    border: colors.borderGlass,
    hi: 0.05,
    shadow: Platform.OS === 'ios' ? shadows.cardElevated : undefined,
  },
  active: {
    bg: colors.glassHi,
    border: colors.borderGlow,
    hi: 0.06,
    shadow: Platform.OS === 'ios' ? shadows.cardElevated : undefined,
  },
  flat: {
    bg: colors.surface,
    border: colors.border,
    hi: 0,
    shadow: undefined,
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,1)',
  },
});
