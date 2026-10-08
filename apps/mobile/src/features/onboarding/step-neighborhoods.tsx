import { DEFAULT_CITY_SLUG, LAUNCHED_CITIES, type CompleteOnboardingInput } from '@vybe/shared';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Roundness, Spacing } from '@/constants/theme';
import { NEIGHBORHOOD_CATALOG } from './neighborhood-catalog';
import { NeighborhoodCard } from './neighborhood-card';
import { OnboardingHeader } from './onboarding-header';
import { OptionCard } from './option-card';
import { RADIUS_OPTIONS } from './preference-options';

const defaultCity = LAUNCHED_CITIES.find((city) => city.slug === DEFAULT_CITY_SLUG) ?? LAUNCHED_CITIES[0];

export function StepNeighborhoods() {
  const {
    control,
    formState: { errors },
  } = useFormContext<CompleteOnboardingInput>();

  return (
    <View style={styles.container}>
      <OnboardingHeader step={2} label="Choose Your City" />

      <View style={styles.hero}>
        <ThemedText type="subtitle">Where&apos;s your home base after sundown?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Choose the Accra neighborhoods where you hang out most. We&apos;ll prioritize spot drops here first.
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.cityPill}>
          <ThemedText type="small">🇬🇭 Greater {defaultCity?.name}, Ghana</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Kumasi & Takoradi coming soon
          </ThemedText>
        </ThemedView>
      </View>

      <Controller
        control={control}
        name="neighborhoods"
        render={({ field }) => (
          <View style={styles.cardList}>
            {NEIGHBORHOOD_CATALOG.map((entry) => {
              const selected = field.value?.includes(entry.neighborhood) ?? false;
              return (
                <NeighborhoodCard
                  key={entry.neighborhood}
                  entry={entry}
                  selected={selected}
                  onPress={() =>
                    field.onChange(
                      selected
                        ? field.value.filter((value) => value !== entry.neighborhood)
                        : [...(field.value ?? []), entry.neighborhood],
                    )
                  }
                />
              );
            })}
          </View>
        )}
      />
      {errors.neighborhoods && <ThemedText type="small">{errors.neighborhoods.message}</ThemedText>}

      <View style={styles.radiusSection}>
        <ThemedText type="smallBold">Maximum vibe radius</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          How far will you travel when a spontaneous drop hits?
        </ThemedText>
        <Controller
          control={control}
          name="travel_radius"
          render={({ field }) => (
            <View style={styles.cardList}>
              {RADIUS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  selected={field.value === option.value}
                  onPress={() => field.onChange(option.value)}
                />
              ))}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  hero: { gap: Spacing.one },
  cardList: { gap: Spacing.two },
  radiusSection: { gap: Spacing.two },
  cityPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Roundness.card,
    padding: Spacing.two,
  },
});
