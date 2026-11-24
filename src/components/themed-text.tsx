import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontFamily: AppFonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: AppFonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: AppFonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: AppFonts.display,
    fontSize: 44,
    lineHeight: 50,
  },
  subtitle: {
    fontFamily: AppFonts.displayBold,
    fontSize: 29,
    lineHeight: 36,
  },
  link: {
    fontFamily: AppFonts.body,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: AppFonts.body,
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
