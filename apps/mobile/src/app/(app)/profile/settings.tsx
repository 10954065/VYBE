import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDeleteAccount } from '@/features/profile/use-delete-account';
import { getErrorMessage } from '@/lib/get-error-message';
import { supabase } from '@/lib/supabase/client';

export default function SettingsScreen() {
  const deleteAccount = useDeleteAccount();

  const handleDeleteAccount = () => {
    Alert.alert('Delete account?', 'This permanently deletes your account and everything tied to it. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onError: (error) => Alert.alert('Could not delete account', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedButton title="Back" variant="ghost" onPress={() => router.back()} />
        <ThemedText type="title">Settings</ThemedText>

        <View style={styles.actions}>
          <ThemedButton title="Log out" variant="ghost" onPress={() => supabase.auth.signOut()} />
          <ThemedButton
            title="Delete account"
            variant="danger"
            loading={deleteAccount.isPending}
            onPress={handleDeleteAccount}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  actions: { gap: Spacing.three, marginTop: 'auto' },
});
