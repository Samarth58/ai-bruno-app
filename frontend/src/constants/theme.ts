import { Platform, StyleSheet } from 'react-native';

/**
 * Bruno AI Gym Buddy Design Tokens
 * Light-theme only: Warm off-white / clean athletic surfaces with athletic green,
 * coach orange mascot branding, and technical blue telemetry accents.
 */
export const Colors = {
  // Surface & Canvas
  background: '#F8F9FF',
  surface: '#F8F9FF',
  canvasBase: '#FFFFFF',
  canvasSecondary: '#F1F5F9',
  surfaceContainerLow: '#EFF4FF',
  surfaceContainer: '#E5EEFF',
  surfaceContainerHigh: '#DCE9FF',

  // Primary Accent: Athletic Green
  primary: '#16A34A',
  primaryHover: '#15803D',
  primarySubtle: '#DCFCE7',
  onPrimary: '#FFFFFF',

  // Coach Mascot Accent: Energetic Coach Orange
  coachOrange: '#EA580C',
  coachOrangeHover: '#C2410C',
  coachOrangeSubtle: '#FFEDD5',
  onCoachOrange: '#FFFFFF',

  // Telemetry & Metrics: Technical Blue
  technicalBlue: '#0284C7',
  technicalBlueSubtle: '#E0F2FE',

  // Text & Neutrals
  charcoalDark: '#0F172A',
  text: '#0F172A',
  slateBody: '#334155',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',

  // Feedback & Status
  success: '#16A34A',
  successSubtle: '#DCFCE7',
  warning: '#F59E0B',
  warningSubtle: '#FEF3C7',
  error: '#DC2626',
  errorSubtle: '#FEE2E2',

  // Fixed light theme compatibility
  light: {
    background: '#F8F9FF',
    text: '#0F172A',
    backgroundElement: '#EFF4FF',
    backgroundSelected: '#E5EEFF',
    textSecondary: '#64748B',
  },
  dark: {
    background: '#F8F9FF',
    text: '#0F172A',
    backgroundElement: '#EFF4FF',
    backgroundSelected: '#E5EEFF',
    textSecondary: '#64748B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Backwards compatibility with initial starter
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = StyleSheet.create({
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: Colors.charcoalDark,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.charcoalDark,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.charcoalDark,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.slateBody,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.charcoalDark,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 72 }) ?? 72;
export const MaxContentWidth = 800;
