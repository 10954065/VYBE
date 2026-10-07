import { zodResolver } from '@hookform/resolvers/zod';
import { createCrewInputSchema, type CreateCrewInput } from '@vybe/shared';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { z } from 'zod';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCreateCrew } from '@/features/crews/use-create-crew';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/get-error-message';

export default function CreateCrewScreen() {
  const createCrew = useCreateCrew();
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof createCrewInputSchema>, unknown, CreateCrewInput>({
    resolver: zodResolver(createCrewInputSchema),
    defaultValues: { name: '', description: '', category: '', privacy: 'public' },
  });

  const onSubmit = handleSubmit((values) => {
    createCrew.mutate(values, {
      onSuccess: (crewId) => router.replace({ pathname: '/crew/[id]', params: { id: crewId } }),
    });
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Name</ThemedText>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <ThemedTextInput placeholder="Accra Weekend Explorers" value={field.value} onChangeText={field.onChange} />
              )}
            />
            {errors.name && <ThemedText type="small">{errors.name.message}</ThemedText>}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Description</ThemedText>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <ThemedTextInput
                  placeholder="What's this crew about?"
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  autoCapitalize="sentences"
                />
              )}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Category (optional)</ThemedText>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <ThemedTextInput placeholder="sports, music, gaming…" value={field.value} onChangeText={field.onChange} />
              )}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Privacy</ThemedText>
            <Controller
              control={control}
              name="privacy"
              render={({ field }) => (
                <ThemedView style={styles.chipRow}>
                  {(['public', 'private'] as const).map((option) => {
                    const selected = field.value === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => field.onChange(option)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}>
                        <ThemedText type="small">{option === 'public' ? 'Public' : 'Private'}</ThemedText>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              )}
            />
          </ThemedView>

          {createCrew.isError && <ThemedText type="small">{getErrorMessage(createCrew.error)}</ThemedText>}

          <ThemedButton title="Create crew" onPress={onSubmit} loading={createCrew.isPending} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.three, gap: Spacing.three },
  field: { gap: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Spacing.four, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
