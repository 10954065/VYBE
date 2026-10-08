import { XP_AWARDS, type CompleteOnboardingInput } from '@vybe/shared';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { OnboardingHeader } from './onboarding-header';
import { OptionCard } from './option-card';
import { CREW_OPTIONS, PACE_OPTIONS, PRIVACY_OPTIONS } from './preference-options';

export function StepPreferences() {
  const { control } = useFormContext<CompleteOnboardingInput>();

  return (
    <View style={styles.container}>
      <OnboardingHeader step={3} label="Create Identity" />

      <View style={styles.hero}>
        <ThemedText type="subtitle">How do you roll outside?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tailor your feed for spontaneous night outs, curated reservations, or squad-only adventures.
        </ThemedText>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Pace & energy level</ThemedText>
        <Controller
          control={control}
          name="nightlife_pace"
          render={({ field }) => (
            <View style={styles.cardList}>
              {PACE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  tag={option.tag}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={field.value === option.value}
                  onPress={() => field.onChange(option.value)}
                />
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Crew dynamics</ThemedText>
        <Controller
          control={control}
          name="crew_preference"
          render={({ field }) => (
            <View style={styles.cardList}>
              {CREW_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={field.value === option.value}
                  onPress={() => field.onChange(option.value)}
                  accent="tertiary"
                />
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Live check-in visibility</ThemedText>
        <Controller
          control={control}
          name="default_check_in_visibility"
          render={({ field }) => (
            <View style={styles.cardList}>
              {PRIVACY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={field.value === option.value}
                  onPress={() => field.onChange(option.value)}
                  accent="secondary"
                />
              ))}
            </View>
          )}
        />
      </View>

      <ThemedView style={styles.perkCard}>
        <ThemedText type="smallBold">🎉 Welcome bonus</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Finishing setup awards +{XP_AWARDS.complete_onboarding} XP toward your first level.
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  hero: { gap: Spacing.one },
  group: { gap: Spacing.two },
  cardList: { gap: Spacing.two },
  perkCard: {
    borderRadius: Roundness.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
