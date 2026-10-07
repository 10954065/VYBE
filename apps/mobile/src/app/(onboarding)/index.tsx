import { zodResolver } from '@hookform/resolvers/zod';
import { completeOnboardingInputSchema, type CompleteOnboardingInput } from '@vybe/shared';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCompleteOnboarding } from '@/features/profile/use-complete-onboarding';
import { useProfile } from '@/features/profile/use-profile';
import { StepGenres } from '@/features/onboarding/step-genres';
import { StepNeighborhoods } from '@/features/onboarding/step-neighborhoods';
import { StepPreferences } from '@/features/onboarding/step-preferences';
import { getErrorMessage } from '@/lib/get-error-message';

type Step = 1 | 2 | 3;

export default function OnboardingScreen() {
  const { data: profile } = useProfile();
  const completeOnboarding = useCompleteOnboarding();
  const [step, setStep] = useState<Step>(1);

  const form = useForm<CompleteOnboardingInput>({
    resolver: zodResolver(completeOnboardingInputSchema),
    defaultValues: {
      username: '',
      display_name: '',
      city_id: '',
      interests: ['music', 'nightlife'],
      genres: [],
      neighborhoods: [],
      travel_radius: 'central',
      nightlife_pace: 'night_owl',
      crew_preference: 'squad',
      default_check_in_visibility: 'followers',
    },
  });
  const { handleSubmit, trigger, reset } = form;

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        display_name: profile.display_name ?? '',
        city_id: profile.city_id ?? '',
        interests: ['music', 'nightlife'],
        genres: [],
        neighborhoods: [],
        travel_radius: 'central',
        nightlife_pace: 'night_owl',
        crew_preference: 'squad',
        default_check_in_visibility: 'followers',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `reset` captured once per profile load is intentional here.
  }, [profile]);

  const goNext = async () => {
    const fieldsForStep = step === 1 ? (['username', 'display_name', 'genres'] as const) : (['neighborhoods'] as const);
    const valid = await trigger(fieldsForStep);
    if (valid) setStep((current) => (current < 3 ? ((current + 1) as Step) : current));
  };

  const goBack = () => setStep((current) => (current > 1 ? ((current - 1) as Step) : current));

  const onSubmit = handleSubmit((values) => {
    completeOnboarding.mutate(values);
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FormProvider {...form}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {step === 1 && <StepGenres />}
            {step === 2 && <StepNeighborhoods />}
            {step === 3 && <StepPreferences />}

            {completeOnboarding.isError && (
              <ThemedText type="small">{getErrorMessage(completeOnboarding.error)}</ThemedText>
            )}

            <ThemedView style={styles.actions}>
              {step < 3 ? (
                <ThemedButton
                  title={step === 1 ? 'Lock in sound vibes' : 'Claim your neighborhoods'}
                  onPress={goNext}
                />
              ) : (
                <ThemedButton
                  title="Complete setup & enter VYBE"
                  onPress={onSubmit}
                  loading={completeOnboarding.isPending}
                />
              )}
              {step > 1 && (
                <Pressable onPress={goBack} style={styles.backButton}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Back
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          </ScrollView>
        </FormProvider>
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
    gap: Spacing.four,
  },
  actions: { gap: Spacing.two, alignItems: 'center' },
  backButton: { padding: Spacing.two },
});
