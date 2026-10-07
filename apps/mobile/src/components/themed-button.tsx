import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

export function ThemedButton({ title, onPress, loading, disabled, variant = 'primary' }: ThemedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#3c87f7' : '#ffffff'} />
      ) : (
        <ThemedText type="smallBold" style={variant === 'ghost' ? styles.ghostLabel : styles.label}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#3c87f7' },
  danger: { backgroundColor: '#d64545' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { color: '#ffffff' },
  ghostLabel: { color: '#3c87f7' },
});
