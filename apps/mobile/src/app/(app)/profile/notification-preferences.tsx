import type { NotificationPreferences, UpdateNotificationPreferencesInput } from '@vybe/shared';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useNotificationPreferences } from '@/features/notifications/use-notification-preferences';
import { useUpdateNotificationPreferences } from '@/features/notifications/use-update-notification-preferences';

const TOGGLES: { key: keyof UpdateNotificationPreferencesInput; label: string }[] = [
  { key: 'follows', label: 'New followers' },
  { key: 'likes', label: 'Reactions to your posts and check-ins' },
  { key: 'comments', label: 'Comments on your posts' },
  { key: 'crew_activity', label: 'Crew join requests and decisions' },
  { key: 'event_reminders', label: 'Event reminders' },
  { key: 'challenges', label: 'Challenge completions' },
  { key: 'streaks', label: 'Streak milestones' },
  { key: 'xp_milestones', label: 'Level ups' },
  { key: 'badges', label: 'Badges earned' },
];

interface PreferenceRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function PreferenceRow({ label, value, onValueChange }: PreferenceRowProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="default" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.backgroundSelected, true: Colors.primary }}
        thumbColor={Colors.text}
      />
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const { data: preferences } = useNotificationPreferences();

  if (!preferences) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return <PreferencesForm preferences={preferences} />;
}

function PreferencesForm({ preferences }: { preferences: NotificationPreferences }) {
  const updatePreferences = useUpdateNotificationPreferences();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <PreferenceRow
            label="Push notifications"
            value={preferences.push_enabled}
            onValueChange={(value) => updatePreferences.mutate({ push_enabled: value })}
          />

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              IN-APP
            </ThemedText>
            {TOGGLES.map((toggle) => (
              <PreferenceRow
                key={toggle.key}
                label={toggle.label}
                value={preferences[toggle.key] as boolean}
                onValueChange={(value) => updatePreferences.mutate({ [toggle.key]: value })}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { marginTop: Spacing.six },
  content: { padding: Spacing.four, gap: Spacing.three },
  section: { gap: Spacing.one, marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  rowLabel: { flex: 1, paddingRight: Spacing.three },
});
