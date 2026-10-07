import { zodResolver } from '@hookform/resolvers/zod';
import { signInInputSchema, type SignInInput } from '@vybe/shared';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSignIn } from '@/features/auth/use-sign-in';
import { getErrorMessage } from '@/lib/get-error-message';

export default function SignInScreen() {
  const signIn = useSignIn();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    signIn.mutate(values);
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">VYBE</ThemedText>
        <ThemedText type="subtitle">Welcome back</ThemedText>

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
                placeholder="Password"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.password && <ThemedText type="small">{errors.password.message}</ThemedText>}
        </ThemedView>

        {signIn.isError && <ThemedText type="small">{getErrorMessage(signIn.error)}</ThemedText>}

        <ThemedButton title="Sign in" onPress={onSubmit} loading={signIn.isPending} />
        <ThemedButton title="Forgot password?" variant="ghost" onPress={() => router.push('/(auth)/forgot-password')} />
        <ThemedButton title="Create an account" variant="ghost" onPress={() => router.push('/(auth)/sign-up')} />
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
