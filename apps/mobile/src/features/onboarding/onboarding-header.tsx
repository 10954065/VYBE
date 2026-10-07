import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface OnboardingHeaderProps {
  step: 1 | 2 | 3;
  label: string;
}

const TOTAL_STEPS = 3;

export function OnboardingHeader({ step, label }: OnboardingHeaderProps) {
  const percent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="primary" style={styles.stepLabel}>
          Step {step} of {TOTAL_STEPS} • {label}
        </ThemedText>
        <ThemedText type="small" style={styles.percentLabel}>
          {percent}% complete
        </ThemedText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { textTransform: 'uppercase', letterSpacing: 1 },
  percentLabel: { fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: Roundness.pill,
    backgroundColor: Colors.backgroundElement,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Roundness.pill,
    backgroundColor: Colors.primary,
  },
});
