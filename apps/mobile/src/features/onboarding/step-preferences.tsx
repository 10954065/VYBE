import { XP_AWARDS, type CompleteOnboardingInput, type CrewPreference, type DefaultCheckInVisibility, type NightlifePace } from '@vybe/shared';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { OnboardingHeader } from './onboarding-header';
import { OptionCard } from './option-card';

const PACE_OPTIONS: { value: NightlifePace; emoji: string; title: string; tag: string; subtitle: string; description: string }[] = [
  {
    value: 'night_owl',
    emoji: '🌙',
    title: 'The Night Owl',
    tag: 'Peak chaos',
    subtitle: 'Out till sunrise • starts after 11 PM',
    description: 'High-energy clubs, Amapiano raves, and private afterparties. Accra never sleeps, and neither do you.',
  },
  {
    value: 'sundowner',
    emoji: '🍹',
    title: 'Sundowner & Social Chill',
    tag: 'Golden hour',
    subtitle: 'Golden hour drinks • home by 1 AM',
    description: 'Golden hour drinks, live acoustic bands, open breezy courtyards, and deep conversations.',
  },
  {
    value: 'explorer',
    emoji: '🧭',
    title: 'Spontaneous Explorer',
    tag: 'Radar-led',
    subtitle: 'Labone ↔ Osu jumps',
    description: 'Wherever the feed glows. Hopping from rooftop to street lounge on pure instinct.',
  },
];

const CREW_OPTIONS: { value: CrewPreference; emoji: string; title: string; subtitle: string; description: string }[] = [
  {
    value: 'squad',
    emoji: '👥',
    title: 'Squad Commander',
    subtitle: 'Prefers crew-first nights out',
    description: 'Prioritize VIP cabana passes, table reservations, bill splitting, and group entry wristbands.',
  },
  {
    value: 'solo',
    emoji: '🛰️',
    title: 'Solo Roamer & Open to Meet',
    subtitle: 'Social mixers & open creator tables',
    description: 'Connect with like-minded creators, spontaneous wingmen, and curated networking.',
  },
];

const PRIVACY_OPTIONS: { value: DefaultCheckInVisibility; emoji: string; title: string; subtitle: string; description: string }[] = [
  {
    value: 'followers',
    emoji: '🛡️',
    title: 'Mutual Friends & Squad Only',
    subtitle: 'Default for new check-ins',
    description: "Friends see when you're checked in. Fully concealed from strangers.",
  },
  {
    value: 'only_me',
    emoji: '🕶️',
    title: 'Incognito Ghost Mode',
    subtitle: 'Default for new check-ins',
    description: 'No live check-in broadcast — browse entirely off-grid.',
  },
];

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
