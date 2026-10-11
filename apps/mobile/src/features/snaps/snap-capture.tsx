import { SNAP_MAX_VIDEO_MS } from '@vybe/shared';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraMode,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/get-error-message';

import { pickSnapFromLibrary, type CapturedSnap } from './snap-media';

const SHUTTER_SIZE = 78;
const CONTROL_SIZE = 44;
// Recording a video isn't supported by the camera on web.
const CAN_RECORD_VIDEO = Platform.OS !== 'web';

function CameraControl({
  icon,
  label,
  onPress,
  isActive = false,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  isActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.control, isActive && styles.controlActive]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <SymbolView name={icon} size={22} tintColor={isActive ? Colors.background : Colors.text} />
    </Pressable>
  );
}

interface SnapCaptureProps {
  onCaptured: (snap: CapturedSnap) => void;
  onClose: () => void;
}

/** The snap camera: tap for a photo, or switch to video and record up to 10 seconds. */
export function SnapCapture({ onCaptured, onClose }: SnapCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [, requestMicrophone] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [mode, setMode] = useState<CameraMode>('picture');
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (recordingStartedAt === null) return;
    const timer = setInterval(() => setElapsedMs(Date.now() - recordingStartedAt), 100);
    return () => clearInterval(timer);
  }, [recordingStartedAt]);

  const chooseFromLibrary = async () => {
    try {
      const picked = await pickSnapFromLibrary();
      if (picked) onCaptured(picked);
    } catch (error) {
      showAlert("Can't send that", getErrorMessage(error));
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isBusy) return;
    setIsBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      onCaptured({
        uri: photo.uri,
        type: 'image',
        width: photo.width,
        height: photo.height,
        durationMs: null,
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      showAlert('Could not take the photo', getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    const microphone = await requestMicrophone();
    if (!microphone.granted) {
      showAlert('Microphone access needed', 'Allow VYBE to use the microphone in Settings to record video snaps.');
      return;
    }
    const startedAt = Date.now();
    setElapsedMs(0);
    setRecordingStartedAt(startedAt);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: SNAP_MAX_VIDEO_MS / 1000 });
      if (video?.uri) {
        onCaptured({
          uri: video.uri,
          type: 'video',
          width: null,
          height: null,
          durationMs: Math.min(Date.now() - startedAt, SNAP_MAX_VIDEO_MS),
          mimeType: null,
        });
      }
    } catch (error) {
      showAlert('Could not record the video', getErrorMessage(error));
    } finally {
      setRecordingStartedAt(null);
    }
  };

  const handleShutter = () => {
    if (mode === 'picture') {
      takePhoto();
    } else if (recordingStartedAt !== null) {
      cameraRef.current?.stopRecording();
    } else {
      startRecording();
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.screen, styles.permission]}>
        <ThemedText type="subtitle" style={styles.centered}>
          Snaps need your camera
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          Allow camera access to take photos and videos for your friends, or send one from your library.
        </ThemedText>
        <ThemedButton
          title={permission.canAskAgain ? 'Allow camera' : 'Open Settings'}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        />
        <ThemedButton title="Choose from library" variant="secondary" onPress={chooseFromLibrary} />
        <ThemedButton title="Cancel" variant="ghost" onPress={onClose} />
      </SafeAreaView>
    );
  }

  const isRecording = recordingStartedAt !== null;
  const secondsLeft = Math.max(0, Math.ceil((SNAP_MAX_VIDEO_MS - elapsedMs) / 1000));

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={mode}
        videoQuality="720p"
        onCameraReady={() => setIsReady(true)}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <CameraControl
            icon={{ ios: 'xmark', android: 'close', web: 'close' }}
            label="Close camera"
            onPress={onClose}
          />
          {isRecording ? (
            <View style={styles.recordingBadge} accessibilityLiveRegion="polite">
              <View style={styles.recordingDot} />
              <Text style={styles.recordingLabel}>{secondsLeft}s</Text>
            </View>
          ) : (
            <View style={styles.topRight}>
              {mode === 'picture' && (
                <CameraControl
                  icon={{
                    ios: flash === 'on' ? 'bolt.fill' : 'bolt.slash',
                    android: flash === 'on' ? 'flash_on' : 'flash_off',
                    web: flash === 'on' ? 'flash_on' : 'flash_off',
                  }}
                  label={flash === 'on' ? 'Flash on' : 'Flash off'}
                  isActive={flash === 'on'}
                  onPress={() => setFlash((current) => (current === 'on' ? 'off' : 'on'))}
                />
              )}
              <CameraControl
                icon={{
                  ios: 'arrow.triangle.2.circlepath.camera',
                  android: 'flip_camera_ios',
                  web: 'flip_camera_ios',
                }}
                label={facing === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
                onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
              />
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <View style={styles.shutterRow}>
            <View style={styles.sideSlot}>
              {!isRecording && (
                <CameraControl
                  icon={{
                    ios: 'photo.on.rectangle',
                    android: 'photo_library',
                    web: 'photo_library',
                  }}
                  label="Choose from library"
                  onPress={chooseFromLibrary}
                />
              )}
            </View>
            <Pressable
              onPress={handleShutter}
              disabled={!isReady || isBusy}
              style={[styles.shutter, !isReady && styles.shutterDisabled]}
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'picture' ? 'Take photo' : isRecording ? 'Stop recording' : 'Start recording'
              }>
              <View
                style={[
                  styles.shutterInner,
                  mode === 'video' && styles.shutterVideo,
                  isRecording && styles.shutterRecording,
                ]}
              />
            </Pressable>
            <View style={styles.sideSlot} />
          </View>

          {CAN_RECORD_VIDEO && !isRecording && (
            <View style={styles.modes} accessibilityRole="radiogroup">
              {(['picture', 'video'] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setMode(option)}
                  accessibilityRole="radio"
                  aria-checked={mode === option}
                  hitSlop={8}>
                  <Text style={[styles.modeLabel, mode === option && styles.modeLabelActive]}>
                    {option === 'picture' ? 'PHOTO' : 'VIDEO'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  permission: {
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  centered: { textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  topRight: { flexDirection: 'row', gap: Spacing.two },
  control: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: CONTROL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  controlActive: { backgroundColor: Colors.text },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: CONTROL_SIZE,
    borderRadius: CONTROL_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30' },
  recordingLabel: { color: Colors.text, fontFamily: FontFamily.bold, fontSize: 15 },
  bottom: { alignItems: 'center', gap: Spacing.three, paddingBottom: Spacing.four },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.five,
  },
  sideSlot: { width: CONTROL_SIZE, alignItems: 'center' },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 5,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: {
    width: SHUTTER_SIZE - 18,
    height: SHUTTER_SIZE - 18,
    borderRadius: (SHUTTER_SIZE - 18) / 2,
  },
  shutterVideo: { backgroundColor: '#FF3B30' },
  shutterRecording: { width: 30, height: 30, borderRadius: 8 },
  modes: { flexDirection: 'row', gap: Spacing.four },
  modeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FontFamily.bold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  modeLabelActive: { color: Colors.secondary },
});
