import { zodResolver } from '@hookform/resolvers/zod';
import { completeOnboardingInputSchema, DEFAULT_CITY_SLUG, INTERESTS, LAUNCHED_CITIES, type CompleteOnboardingInput } from '@vybe/shared';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCompleteOnboarding } from '@/features/profile/use-complete-onboarding';
import { useProfile } from '@/features/profile/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/get-error-message';

const defaultCity = LAUNCHED_CITIES.find((city) => city.slug === DEFAULT_CITY_SLUG) ?? LAUNCHED_CITIES[0];

export default function OnboardingScreen() {
  const { data: profile } = useProfile();
  const completeOnboarding = useCompleteOnboarding();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteOnboardingInput>({
    resolver: zodResolver(completeOnboardingInputSchema),
    defaultValues: { username: '', display_name: '', city_id: '', interests: [] },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        display_name: profile.display_name ?? '',
        city_id: profile.city_id ?? '',
        interests: [],
      });
    }
  }, [profile, reset]);

  const onSubmit = handleSubmit((values) => {
    completeOnboarding.mutate(values);
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Welcome to VYBE</ThemedText>
          <ThemedText type="small">A few details before you dive in.</ThemedText>

          <ThemedView type="background" style={styles.field}>
            <ThemedText type="smallBold">Username</ThemedText>
            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <ThemedTextInput placeholder="username" value={field.value} onChangeText={field.onChange} />
              )}
            />
            {errors.username && <ThemedText type="small">{errors.username.message}</ThemedText>}
          </ThemedView>

          <ThemedView type="background" style={styles.field}>
            <ThemedText type="smallBold">Display name</ThemedText>
            <Controller
              control={control}
              name="display_name"
              render={({ field }) => (
                <ThemedTextInput placeholder="Your name" value={field.value} onChangeText={field.onChange} />
              )}
            />
            {errors.display_name && <ThemedText type="small">{errors.display_name.message}</ThemedText>}
          </ThemedView>

          <ThemedView type="background" style={styles.field}>
            <ThemedText type="smallBold">City</ThemedText>
            <ThemedText type="small">{defaultCity?.name} — more cities coming soon</ThemedText>
          </ThemedView>

          <ThemedView type="background" style={styles.field}>
            <ThemedText type="smallBold">What are you into?</ThemedText>
            <Controller
              control={control}
              name="interests"
              render={({ field }) => (
                <ThemedView type="background" style={styles.chipRow}>
                  {INTERESTS.map((interest) => {
                    const selected = field.value.includes(interest);
                    return (
                      <Pressable
                        key={interest}
                        onPress={() =>
                          field.onChange(
                            selected ? field.value.filter((value) => value !== interest) : [...field.value, interest],
                          )
                        }
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}>
                        <ThemedText type="small">{interest}</ThemedText>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              )}
            />
            {errors.interests && <ThemedText type="small">Pick at least one.</ThemedText>}
          </ThemedView>

          {completeOnboarding.isError && (
            <ThemedText type="small">{getErrorMessage(completeOnboarding.error)}</ThemedText>
          )}

          <ThemedButton title="Let's go" onPress={onSubmit} loading={completeOnboarding.isPending} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  field: { gap: Spacing.two },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
