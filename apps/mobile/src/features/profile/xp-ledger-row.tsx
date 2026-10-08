import type { XpTransaction } from '@vybe/shared';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format-relative-time';

const REASON_LABELS: Record<string, string> = {
  check_in: 'Checked in',
  attend_event: 'Attended an event',
  create_post: 'Shared a post',
  join_challenge: 'Joined a quest',
  complete_challenge: 'Completed a quest',
  join_crew: 'Joined a crew',
  explore_new_place: 'Explored a new place',
  meaningful_engagement_received: 'Got some love',
  complete_onboarding: 'Completed onboarding',
};

interface XpLedgerRowProps {
  transaction: XpTransaction;
}

export function XpLedgerRow({ transaction }: XpLedgerRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <ThemedText type="smallBold">{REASON_LABELS[transaction.reason] ?? transaction.reason}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(transaction.created_at)}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" themeColor="tertiary">
        +{transaction.amount} XP
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.three,
  },
  info: { gap: 2 },
});
