import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert is a complete no-op (confirmed by reading
// its source: `static alert() {}`) -- every pre-existing Alert.alert
// confirmation in this app (delete account, leave crew, etc.) already
// silently does nothing on web. That's a pre-existing, systemic gap bigger
// than this one call site; this helper only fixes it for the destructive
// confirmations this phase adds, via window.confirm on web.
export function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
