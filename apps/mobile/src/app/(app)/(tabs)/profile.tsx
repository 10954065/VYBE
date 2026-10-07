import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useDeleteAccount } from '@/features/profile/use-delete-account';
import { useProfile } from '@/features/profile/use-profile';
import { getErrorMessage } from '@/lib/get-error-message';
import { supabase } from '@/lib/supabase/client';

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
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
        {isLoading || !profile ? (
          <ThemedText type="small">Loading…</ThemedText>
        ) : (
          <ThemedView type="background" style={styles.info}>
            <ThemedText type="title">{profile.display_name ?? profile.username}</ThemedText>
            <ThemedText type="small">@{profile.username}</ThemedText>
          </ThemedView>
        )}

        <ThemedView type="background" style={styles.actions}>
          <ThemedButton title="Log out" variant="ghost" onPress={() => supabase.auth.signOut()} />
          <ThemedButton
            title="Delete account"
            variant="danger"
            loading={deleteAccount.isPending}
            onPress={handleDeleteAccount}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  info: { gap: Spacing.one },
  actions: { gap: Spacing.three },
});
