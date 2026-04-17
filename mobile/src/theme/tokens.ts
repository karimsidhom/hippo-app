/**
 * Hippo design tokens — mirror of `src/app/globals.css`.
 *
 * This file is the native-side source of truth for the Hippo design
 * system v2 ("Premium surgical performance ecosystem. Single accent,
 * Geist type, restrained surfaces, no card soup."). Values MUST match
 * the :root block in globals.css — if you change anything here, change
 * it there too, or the apps will drift visually.
 */

export const colors = {
  // Canvas — the darkest base the eye ever sees.
  bg: '#060d13',
  bgElevated: '#0c1219',

  // Two surface levels only. The H-bar glass language does the rest.
  surface: '#0c1219',
  surface2: '#111a23',

  // Surface tints for the EPA form + nested modals.
  bg1: '#0e1520',
  bg2: '#141c28',
  bg3: '#1a2332',

  // Teal glass tints — translucent panels.
  glass: 'rgba(14, 165, 233, 0.02)',
  glassMid: 'rgba(14, 165, 233, 0.04)',
  glassHi: 'rgba(14, 165, 233, 0.06)',

  // Surgical-thin borders.
  border: 'rgba(255, 255, 255, 0.04)',
  borderMid: 'rgba(255, 255, 255, 0.06)',
  borderGlass: 'rgba(14, 165, 233, 0.08)',
  borderGlow: 'rgba(14, 165, 233, 0.16)',

  // Text — 4-tier hierarchy. Never introduce a 5th.
  text: '#E2E8F0',
  text2: '#64748B',
  text3: '#475569',
  muted: '#334155',

  // Single accent: Surgical Teal.
  primary: '#0EA5E9',
  primaryHi: '#38BDF8',
  primaryLo: '#0284C7',
  primaryDim: 'rgba(14, 165, 233, 0.05)',
  primaryGlow: 'rgba(14, 165, 233, 0.10)',

  // Signal.
  success: '#10B981',
  successHi: '#34D399',
  danger: '#EF4444',
  dangerHi: '#F87171',
  warning: '#F59E0B',
  warningHi: '#FBBF24',
} as const;

export const radii = {
  xs: 4, // --rs
  sm: 6, // --r
  md: 10, // --rl
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  fontFamily: {
    // Loaded via @expo-google-fonts/geist at app boot. Fallbacks match
    // the web `body { font-family }` so text doesn't visually jump
    // during font hydration.
    sans: 'Geist_400Regular',
    sansMedium: 'Geist_500Medium',
    sansSemibold: 'Geist_600SemiBold',
    sansBold: 'Geist_700Bold',
    mono: 'GeistMono_400Regular',
    monoMedium: 'GeistMono_500Medium',
  },
  fontSize: {
    xxs: 9, // section-title
    xs: 11,
    sm: 12, // chip, badge
    base: 13,
    md: 14,
    lg: 15,
    xl: 18,
    xxl: 22,
    xxxl: 28, // h1
    display: 38,
  },
  inputFontSize: 16,
  // Web uses `letter-spacing: -0.01em` on body, `1.4px` on section-
  // title, etc. RN accepts `letterSpacing: number` (absolute pt).
  letterSpacing: {
    tight: -0.2,
    body: -0.15,
    wide: 0.4,
    uppercase: 1.2,
  },
} as const;

export const shadows = {
  // "Inset 0 1px 0 rgba(255,255,255,0.04)" — RN doesn't support inset
  // shadow natively; we approximate with a 1px top border in the Card.
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 24,
  },
  glow: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const durations = {
  fast: 200,
  base: 350,
  slow: 500,
} as const;
