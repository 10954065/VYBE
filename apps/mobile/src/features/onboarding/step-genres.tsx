import type { CompleteOnboardingInput } from '@vybe/shared';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { GENRE_CATALOG } from './genre-catalog';
import { GenreCard } from './genre-card';
import { OnboardingHeader } from './onboarding-header';

const MIN_GENRES = 3;

export function StepGenres() {
  const {
    control,
    formState: { errors },
  } = useFormContext<CompleteOnboardingInput>();

  return (
    <View style={styles.container}>
      <View style={styles.identityFields}>
        <ThemedText type="smallBold">Your VYBE identity</ThemedText>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <ThemedTextInput placeholder="username" value={field.value} onChangeText={field.onChange} />
          )}
        />
        {errors.username && <ThemedText type="small">{errors.username.message}</ThemedText>}
        <Controller
          control={control}
          name="display_name"
          render={({ field }) => (
            <ThemedTextInput placeholder="Display name" value={field.value} onChangeText={field.onChange} />
          )}
        />
        {errors.display_name && <ThemedText type="small">{errors.display_name.message}</ThemedText>}
      </View>

      <OnboardingHeader step={1} label="Musical DNA" />

      <View style={styles.hero}>
        <ThemedText type="subtitle">What moves your crowd?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Select at least {MIN_GENRES} signature genres to tune your feed and discovery to your sound.
        </ThemedText>
      </View>

      <Controller
        control={control}
        name="genres"
        render={({ field }) => (
          <View style={styles.cardList}>
            {GENRE_CATALOG.map((entry) => {
              const selected = field.value?.includes(entry.genre) ?? false;
              return (
                <GenreCard
                  key={entry.genre}
                  entry={entry}
                  selected={selected}
                  onPress={() =>
                    field.onChange(
                      selected
                        ? field.value.filter((value) => value !== entry.genre)
                        : [...(field.value ?? []), entry.genre],
                    )
                  }
                />
              );
            })}
          </View>
        )}
      />
      {errors.genres && <ThemedText type="small">{errors.genres.message}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  identityFields: { gap: Spacing.two },
  hero: { gap: Spacing.one },
  cardList: { gap: Spacing.two },
});
