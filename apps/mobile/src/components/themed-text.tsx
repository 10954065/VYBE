import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, FontFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  smallBold: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.02 * 14,
  },
  default: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.025 * 32,
  },
  subtitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.015 * 22,
  },
  link: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  linkPrimary: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
