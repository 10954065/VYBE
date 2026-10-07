import { zodResolver } from '@hookform/resolvers/zod';
import { signUpInputSchema, type SignUpInput } from '@vybe/shared';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSignUp } from '@/features/auth/use-sign-up';
import { getErrorMessage } from '@/lib/get-error-message';

export default function SignUpScreen() {
  const signUp = useSignUp();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    signUp.mutate(values);
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">VYBE</ThemedText>
        <ThemedText type="subtitle">Create your account</ThemedText>

        <ThemedView type="background" style={styles.field}>
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
        </ThemedView>

        <ThemedView type="background" style={styles.field}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <ThemedTextInput
                placeholder="Password (8+ characters)"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.password && <ThemedText type="small">{errors.password.message}</ThemedText>}
        </ThemedView>

        {signUp.isSuccess && (
          <ThemedText type="small">Check your email to confirm your account, then sign in.</ThemedText>
        )}
        {signUp.isError && <ThemedText type="small">{getErrorMessage(signUp.error)}</ThemedText>}

        <ThemedButton title="Create account" onPress={onSubmit} loading={signUp.isPending} />
        <ThemedButton title="Already have an account? Sign in" variant="ghost" onPress={() => router.push('/(auth)/sign-in')} />
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
    gap: Spacing.three,
  },
  field: { gap: Spacing.one },
});
