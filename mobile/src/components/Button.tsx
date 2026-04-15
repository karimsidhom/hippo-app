import { ActivityIndicator, Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radii } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  style?: ViewStyle;
}

const sizeStyles: Record<Size, { height: number; paddingX: number; fontSize: number }> = {
  sm: { height: 36, paddingX: 12, fontSize: 13 },
  // 44pt is the Apple HIG minimum tappable target. All primary
  // actions on the mobile app use md or lg by default.
  md: { height: 44, paddingX: 16, fontSize: 15 },
  lg: { height: 52, paddingX: 20, fontSize: 16 },
};

function variantColors(variant: Variant, pressed: boolean, disabled: boolean) {
  const dim = disabled ? 0.4 : 1;
  if (variant === 'primary') {
    return {
      bg: pressed ? '#0284c7' : colors.primary,
      fg: '#ffffff',
      border: 'transparent',
      opacity: dim,
    };
  }
  if (variant === 'secondary') {
    return {
      bg: pressed ? colors.surface2 : colors.surface,
      fg: colors.text,
      border: colors.borderMid,
      opacity: dim,
    };
  }
  if (variant === 'danger') {
    return {
      bg: pressed ? '#dc2626' : colors.danger,
      fg: '#ffffff',
      border: 'transparent',
      opacity: dim,
    };
  }
  return {
    bg: pressed ? colors.surface : 'transparent',
    fg: colors.text2,
    border: 'transparent',
    opacity: dim,
  };
}

/**
 * Primary tappable primitive. Every button in the app goes through
 * this so hit areas, haptics, loading states, and disabled-states
 * are consistent. Haptics fire on press (light impact) — matches
 * Apple's native feel.
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  leadingIcon,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const { height, paddingX, fontSize } = sizeStyles[size];
  const isDisabled = !!(disabled || loading);

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      onPress={(e) => {
        if (isDisabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => {
        const c = variantColors(variant, pressed, isDisabled);
        return {
          height,
          paddingHorizontal: paddingX,
          backgroundColor: c.bg,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: c.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: c.opacity,
          width: fullWidth ? '100%' : undefined,
          ...(style as object),
        };
      }}
    >
      {({ pressed }) => {
        const c = variantColors(variant, pressed, isDisabled);
        return (
          <>
            {loading ? (
              <ActivityIndicator size="small" color={c.fg} />
            ) : leadingIcon ? (
              <View>{leadingIcon}</View>
            ) : null}
            <Text
              style={{ color: c.fg, fontSize, fontWeight: '600' }}
            >
              {title}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}
