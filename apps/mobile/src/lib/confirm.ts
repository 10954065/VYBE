import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert is a complete no-op (confirmed by reading
// its source: `static alert() {}`), so on web every alert and confirmation
// silently did nothing. Every call site in the app goes through these two
// helpers instead, which fall back to the browser's own dialogs on web.

export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

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
