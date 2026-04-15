/**
 * Hippo design tokens — mirrored from the web app's CSS variables.
 *
 * Keep these in sync with `src/app/globals.css`. A later phase will
 * generate both the CSS and TS tokens from a single source of truth
 * (likely a `tokens.json` in `src/lib/shared/design/`).
 */

export const colors = {
  bg: '#0a0a0f',
  bg1: '#12121a',
  bg2: '#16161f',
  surface: '#16161f',
  surface2: '#1e1e2a',
  border: '#1f1f23',
  borderMid: '#252838',
  text: '#f1f5f9',
  text2: '#d4d4d8',
  text3: '#71717a',
  muted: '#52525b',
  primary: '#0ea5e9',
  primaryDim: 'rgba(14, 165, 233, 0.12)',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
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
    sans: 'Geist',
    mono: 'GeistMono',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  // iOS zooms inputs with computed font-size < 16. The mobile app is
  // immune to that since it's not a WebView, but we keep inputs at
  // ≥16 anyway for readability in the OR.
  inputFontSize: 16,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 24,
  },
} as const;
