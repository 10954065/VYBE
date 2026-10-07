/**
 * VYBE's design tokens — "Afro-Electric Neon Obsidian", generated in Stitch
 * (see docs/design-system.md). The product is dark-only by design: there is
 * no light-mode counterpart in the source design system, so `useTheme`
 * always returns this one palette regardless of system color scheme.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  background: '#090A0F',
  backgroundElement: '#1A1D2B',
  backgroundSelected: '#25293C',
  hairline: 'rgba(255, 255, 255, 0.08)',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',

  primary: '#8B5CF6',
  primaryStrong: '#7C3AED',
  onPrimary: '#F8FAFC',

  secondary: '#F97316',
  secondaryStrong: '#EC4899',

  tertiary: '#10B981',

  danger: '#FFB4AB',
  dangerContainer: '#93000A',
} as const;

export type ThemeColor = keyof typeof Colors;

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  default: {
    sans: FontFamily.regular,
    mono: 'monospace',
  },
  web: {
    sans: FontFamily.regular,
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Pill radius for buttons, inputs, and chips — the design system's default. */
export const Roundness = {
  pill: 9999,
  card: 24,
  sheet: 32,
} as const;

/** Elevated-surface glow, per the design system's "Neon Aura" spec. */
export const Glow = {
  primary: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

// `web` covers the floating dock in app-tabs.web.tsx, which has no native
// safe-area inset of its own — content must reserve space for it manually.
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 96 }) ?? 0;
export const MaxContentWidth = 800;
