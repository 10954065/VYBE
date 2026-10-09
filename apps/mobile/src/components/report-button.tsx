import { REPORT_CATEGORIES, type ReportCategory, type ReportTargetType } from '@vybe/shared';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { useCreateReport } from '@/features/moderation/use-create-report';
import { formatLabel } from '@/lib/format-label';
import { getErrorMessage } from '@/lib/get-error-message';

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
}

export function ReportButton({ targetType, targetId, label = 'Report' }: ReportButtonProps) {
  const createReport = useCreateReport();
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState('');

  const reset = () => {
    setVisible(false);
    setCategory(null);
    setDetails('');
  };

  const handleSubmit = () => {
    if (!category) return;
    createReport.mutate(
      { target_type: targetType, target_id: targetId, category, details: details.trim() || undefined },
      {
        onSuccess: () => {
          reset();
          Alert.alert('Report submitted', "Thanks — we'll look into it.");
        },
        onError: (error) => Alert.alert('Could not submit report', getErrorMessage(error)),
      },
    );
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)} accessibilityRole="button" accessibilityLabel={label}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <ThemedText type="subtitle">Report this {formatLabel(targetType).toLowerCase()}</ThemedText>
            <View style={styles.categoryList}>
              {REPORT_CATEGORIES.map((option) => {
                const selected = option === category;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
                    style={[styles.categoryRow, selected && styles.categoryRowSelected]}>
                    <ThemedText type="small">{formatLabel(option)}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedTextInput
              placeholder="Add details (optional)"
              value={details}
              onChangeText={setDetails}
              multiline
              autoCapitalize="sentences"
            />
            {createReport.isError && (
              <ThemedText type="small">{getErrorMessage(createReport.error)}</ThemedText>
            )}
            <View style={styles.actions}>
              <ThemedButton title="Cancel" variant="ghost" onPress={reset} />
              <ThemedButton
                title="Submit"
                onPress={handleSubmit}
                disabled={!category}
                loading={createReport.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9, 10, 15, 0.7)', justifyContent: 'center', padding: Spacing.four },
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, padding: Spacing.four, gap: Spacing.three },
  categoryList: { gap: Spacing.one },
  categoryRow: { borderRadius: Spacing.three, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  categoryRowSelected: { backgroundColor: Colors.backgroundSelected },
  actions: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
});
