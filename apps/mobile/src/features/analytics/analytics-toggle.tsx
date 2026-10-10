import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { getAnalyticsOptOut, setAnalyticsOptOut } from '@/lib/analytics/analytics';

const QUERY_KEY = ['analytics-opt-out'];

/** Lets someone turn off usage analytics on this device. */
export function AnalyticsToggle() {
  const queryClient = useQueryClient();
  const { data: isOptedOut } = useQuery({ queryKey: QUERY_KEY, queryFn: getAnalyticsOptOut });
  const update = useMutation({
    mutationFn: setAnalyticsOptOut,
    onSuccess: (_data, optOut) => queryClient.setQueryData(QUERY_KEY, optOut),
  });

  const isSharing = isOptedOut === false;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <ThemedText type="default">Share usage analytics</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Which screens and features you use, never what you post or search for.
        </ThemedText>
      </View>
      <Switch
        accessibilityLabel="Share usage analytics"
        value={isSharing}
        disabled={isOptedOut === undefined || update.isPending}
        onValueChange={(value) => update.mutate(!value)}
        trackColor={{ false: Colors.backgroundSelected, true: Colors.primary }}
        thumbColor={Colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.half },
});
