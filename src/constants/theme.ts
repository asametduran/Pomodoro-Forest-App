/**
 * Forest Pomodoro design tokens, sampled from the design mockups (images/1-3.png):
 * warm cream + sage green in light mode, deep forest green + cream in dark mode.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#27301F',
    textSecondary: '#7B7466',
    textMuted: '#A39A8B',
    background: '#F9F1E6',
    backgroundElement: '#F4EADD',
    backgroundSelected: '#E7DCCB',
    card: '#FDF8F1',
    cardAlt: '#F3E9DC',
    border: '#E8DCCB',
    primary: '#6F956A',
    primaryStrong: '#5F8657',
    primaryButton: '#64885C',
    primaryText: '#FFFFFF',
    accent: '#B5835A',
    accentSoft: '#F4E4CC',
    gold: '#E5A93A',
    danger: '#E2794F',
    dangerSoft: '#FCE4D2',
    grownCard: '#F2EFDB',
    witheredCard: '#FCE2CF',
    soil: '#8A5E3E',
    tabBar: '#F3E8DA',
    tabActive: '#5F8657',
    tabInactive: '#968D7F',
    tabActiveBg: 'transparent',
    sheet: '#FBF4EA',
    shadow: 'rgba(110, 84, 50, 0.12)',
    xpTrack: '#E2D7C7',
    xpFill: '#628759',
  },
  dark: {
    text: '#F3EADB',
    textSecondary: '#AEB3A4',
    textMuted: '#7E8577',
    background: '#212820',
    backgroundElement: '#2B332A',
    backgroundSelected: '#36402F',
    card: '#2B342B',
    cardAlt: '#262E25',
    border: '#38422F',
    primary: '#7AA474',
    primaryStrong: '#6C8F66',
    primaryButton: '#7BA577',
    primaryText: '#F7F2E8',
    accent: '#D9A66E',
    accentSoft: '#3B3326',
    gold: '#EDB548',
    danger: '#E8896A',
    dangerSoft: '#46302A',
    grownCard: '#2D382B',
    witheredCard: '#45302A',
    soil: '#7A5236',
    tabBar: '#1C221B',
    tabActive: '#8DBB83',
    tabInactive: '#99A091',
    tabActiveBg: '#2E3B2E',
    sheet: '#292C27',
    shadow: 'rgba(0, 0, 0, 0.35)',
    xpTrack: '#4A5348',
    xpFill: '#89B283',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemePalette = (typeof Colors)['light' | 'dark'];

/**
 * Loaded in the root layout via expo-font.
 * Fraunces (a warm, soft serif) for headings and the timer; Nunito (rounded sans) for the interface.
 */
export const AppFonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayRegular: 'Fraunces_400Regular',
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

/** Soft drop shadow used by cards and chips (boxShadow works on web, iOS and Android). */
export function cardShadow(color: string, strength: 'soft' | 'raised' = 'soft'): string {
  return strength === 'raised' ? `0px 6px 16px ${color}` : `0px 2px 8px ${color}`;
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 600;
