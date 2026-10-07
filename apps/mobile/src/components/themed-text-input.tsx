import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { FontFamily, Roundness, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ThemedTextInput({ style, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      style={[
        styles.input,
        { color: theme.text, backgroundColor: theme.background, borderColor: theme.hairline },
        style,
      ]}
      placeholderTextColor={theme.textSecondary}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Roundness.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
});
