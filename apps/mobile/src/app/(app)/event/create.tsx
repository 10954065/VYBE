import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCreateEvent } from '@/features/events/use-create-event';
import { getErrorMessage } from '@/lib/get-error-message';

const formSchema = z.object({
  title: z.string().trim().min(3, 'At least 3 characters.').max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(60).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM, 24h.'),
  capacity: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export default function CreateEventScreen() {
  const createEvent = useCreateEvent();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', category: '', date: '', time: '', capacity: '' },
  });

  const onSubmit = handleSubmit((values) => {
    const startAt = new Date(`${values.date}T${values.time}`);
    if (Number.isNaN(startAt.getTime())) return;

    createEvent.mutate(
      {
        title: values.title,
        description: values.description || undefined,
        category: values.category || undefined,
        start_at: startAt,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        visibility: 'everyone',
      },
      {
        onSuccess: () => router.back(),
      },
    );
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Title</ThemedText>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <ThemedTextInput placeholder="Rooftop hangout" value={field.value} onChangeText={field.onChange} />
              )}
            />
            {errors.title && <ThemedText type="small">{errors.title.message}</ThemedText>}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Description</ThemedText>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <ThemedTextInput
                  placeholder="What's the plan?"
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  autoCapitalize="sentences"
                />
              )}
            />
          </ThemedView>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Date</ThemedText>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <ThemedTextInput placeholder="2026-10-09" value={field.value} onChangeText={field.onChange} />
                )}
              />
              {errors.date && <ThemedText type="small">{errors.date.message}</ThemedText>}
            </ThemedView>
            <ThemedView style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Time</ThemedText>
              <Controller
                control={control}
                name="time"
                render={({ field }) => (
                  <ThemedTextInput placeholder="18:00" value={field.value} onChangeText={field.onChange} />
                )}
              />
              {errors.time && <ThemedText type="small">{errors.time.message}</ThemedText>}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Category (optional)</ThemedText>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <ThemedTextInput placeholder="music, networking, sports…" value={field.value} onChangeText={field.onChange} />
              )}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Capacity (optional)</ThemedText>
            <Controller
              control={control}
              name="capacity"
              render={({ field }) => (
                <ThemedTextInput
                  placeholder="50"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="number-pad"
                />
              )}
            />
          </ThemedView>

          {createEvent.isError && <ThemedText type="small">{getErrorMessage(createEvent.error)}</ThemedText>}

          <ThemedButton title="Create event" onPress={onSubmit} loading={createEvent.isPending} />
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
  row: { flexDirection: 'row', gap: Spacing.three },
  flex1: { flex: 1 },
});
