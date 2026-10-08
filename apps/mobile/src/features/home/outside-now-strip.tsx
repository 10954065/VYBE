import type { PersonOutsideNow } from '@vybe/shared';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface OutsideNowStripProps {
  people: PersonOutsideNow[];
}

export function OutsideNowStrip({ people }: OutsideNowStripProps) {
  if (people.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Nobody in your network has checked in recently.
      </ThemedText>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {people.map((person) => (
        <View key={person.user_id} style={styles.card}>
          <View style={styles.avatarWrap}>
            {person.avatar_url ? (
              <Image source={{ uri: person.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <ThemedText type="smallBold">{(person.display_name ?? person.username)[0]?.toUpperCase()}</ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
            {person.display_name ?? person.username}
          </ThemedText>
          {person.place_name && (
            <ThemedText type="small" themeColor="secondary" numberOfLines={1} style={styles.place}>
              {person.place_name}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor={person.is_friend ? 'tertiary' : 'textSecondary'} style={styles.meta}>
            {person.is_friend ? 'Friend' : `${person.mutual_friend_count} mutuals`}
          </ThemedText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  card: {
    width: 112,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  avatarWrap: { marginBottom: Spacing.one },
  avatar: { width: 56, height: 56, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  name: { maxWidth: 96 },
  place: { maxWidth: 96 },
  meta: { fontSize: 10 },
});
