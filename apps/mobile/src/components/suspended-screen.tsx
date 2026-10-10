import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

interface SuspendedScreenProps {
  reason: string | null;
}

export function SuspendedScreen({ reason }: SuspendedScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.body}>
          <ThemedText type="title">Account suspended</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your VYBE account has been suspended by a moderator and can&apos;t be used right now.
          </ThemedText>
          {reason && (
            <ThemedView type="backgroundElement" style={styles.reason}>
              <ThemedText type="smallBold">Reason</ThemedText>
              <ThemedText type="small">{reason}</ThemedText>
            </ThemedView>
          )}
        </View>
        <ThemedButton title="Log out" variant="ghost" onPress={() => supabase.auth.signOut()} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'space-between' },
  body: { gap: Spacing.three, marginTop: Spacing.six },
  reason: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
});
