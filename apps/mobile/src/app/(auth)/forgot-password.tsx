import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordResetInputSchema, type RequestPasswordResetInput } from '@vybe/shared';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRequestPasswordReset } from '@/features/auth/use-request-password-reset';
import { getErrorMessage } from '@/lib/get-error-message';

export default function ForgotPasswordScreen() {
  const requestReset = useRequestPasswordReset();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetInputSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((values) => {
    requestReset.mutate(values);
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BrandMark />
          <ThemedText type="subtitle">Reset your password</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            We&apos;ll email you a link to reset it.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <ThemedTextInput
                  placeholder="Email"
                  keyboardType="email-address"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
            {errors.email && <ThemedText type="small">{errors.email.message}</ThemedText>}
          </View>

          {requestReset.isSuccess && <ThemedText type="small">Check your email for a reset link.</ThemedText>}
          {requestReset.isError && <ThemedText type="small">{getErrorMessage(requestReset.error)}</ThemedText>}

          <ThemedButton title="Send reset link" onPress={onSubmit} loading={requestReset.isPending} />
          <ThemedButton title="Back to sign in" variant="ghost" onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  header: { gap: Spacing.one },
  form: { gap: Spacing.three },
  field: { gap: Spacing.one },
});
