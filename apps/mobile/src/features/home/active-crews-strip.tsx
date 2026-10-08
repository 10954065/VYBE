import type { MyCrew } from '@vybe/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface ActiveCrewsStripProps {
  crews: MyCrew[];
  limit?: number;
  emptyHint?: string;
}

export function ActiveCrewsStrip({
  crews,
  limit = 3,
  emptyHint = "You haven't joined a crew yet — find one in the Crews tab.",
}: ActiveCrewsStripProps) {
  if (crews.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {emptyHint}
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {crews.slice(0, limit).map((crew) => (
        <Pressable
          key={crew.id}
          onPress={() => router.push({ pathname: '/(app)/crew/[id]', params: { id: crew.id } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.iconWrap}>
            <ThemedText style={styles.icon}>👥</ThemedText>
          </View>
          <View style={styles.info}>
            <ThemedText type="smallBold">{crew.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {crew.member_count} members
              {crew.outside_now_count > 0 ? ` • 🔥 ${crew.outside_now_count} outside now` : ''}
            </ThemedText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Roundness.card,
    padding: Spacing.three,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Roundness.card,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  info: { flex: 1, gap: 2 },
});
