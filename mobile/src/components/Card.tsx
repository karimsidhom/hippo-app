import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { colors, radii } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Subtle = surface bg, Elevated = surface2 bg + hairline border. */
  variant?: 'subtle' | 'elevated';
  padding?: number;
}

export function Card({ children, style, variant = 'subtle', padding = 16 }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: variant === 'elevated' ? colors.surface2 : colors.surface,
          borderRadius: radii.lg,
          borderWidth: variant === 'elevated' ? 1 : 0,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
