import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSuggestedPeople, type SuggestedPerson } from '@/features/feed/use-suggested-people';
import { useToggleFollow } from '@/features/feed/use-toggle-follow';

export function SuggestedPeopleStrip() {
  const { data: people } = useSuggestedPeople();
  const toggleFollow = useToggleFollow();

  if (!people || people.length === 0) return null;

  const renderItem = ({ item }: { item: SuggestedPerson }) => (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{item.display_name ?? item.username}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        @{item.username}
      </ThemedText>
      <ThemedButton
        title="Follow"
        variant="ghost"
        loading={toggleFollow.isPending && toggleFollow.variables?.target_user_id === item.id}
        onPress={() => toggleFollow.mutate({ target_user_id: item.id, is_following: false })}
      />
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">People to follow</ThemedText>
      <FlatList
        data={people}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  list: { gap: Spacing.two },
  card: {
    width: 140,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
