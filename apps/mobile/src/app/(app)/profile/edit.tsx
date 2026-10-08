import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CREW_OPTIONS, PACE_OPTIONS, PRIVACY_OPTIONS, RADIUS_OPTIONS } from '@/features/onboarding/preference-options';
import { OptionCard } from '@/features/onboarding/option-card';
import { useProfile } from '@/features/profile/use-profile';
import { useUpdateProfile } from '@/features/profile/use-update-profile';
import { getErrorMessage } from '@/lib/get-error-message';
import type { CrewPreference, DefaultCheckInVisibility, NightlifePace, ProfileRow, TravelRadius } from '@vybe/shared';

export default function EditProfileScreen() {
  const { data: profile } = useProfile();

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return <EditProfileForm profile={profile} />;
}

// Mounted only once `profile` is loaded, so every field's initial state can
// be derived straight from it with no effect/setState-on-load needed.
function EditProfileForm({ profile }: { profile: ProfileRow }) {
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [travelRadius, setTravelRadius] = useState<TravelRadius | null>(profile.travel_radius);
  const [nightlifePace, setNightlifePace] = useState<NightlifePace | null>(profile.nightlife_pace);
  const [crewPreference, setCrewPreference] = useState<CrewPreference | null>(profile.crew_preference);
  const [visibility, setVisibility] = useState<DefaultCheckInVisibility>(profile.default_check_in_visibility);

  const handleSave = () => {
    updateProfile.mutate(
      {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        travel_radius: travelRadius,
        nightlife_pace: nightlifePace,
        crew_preference: crewPreference,
        default_check_in_visibility: visibility,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Edit Profile</ThemedText>

          <View style={styles.group}>
            <ThemedText type="smallBold">Display name</ThemedText>
            <ThemedTextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" autoCapitalize="words" />
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">Bio</ThemedText>
            <ThemedTextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Creative director & weekend explorer..."
              multiline
              style={styles.bioInput}
            />
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">Maximum vibe radius</ThemedText>
            <View style={styles.cardList}>
              {RADIUS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  selected={travelRadius === option.value}
                  onPress={() => setTravelRadius(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">Pace & energy level</ThemedText>
            <View style={styles.cardList}>
              {PACE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  tag={option.tag}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={nightlifePace === option.value}
                  onPress={() => setNightlifePace(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">Crew dynamics</ThemedText>
            <View style={styles.cardList}>
              {CREW_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={crewPreference === option.value}
                  onPress={() => setCrewPreference(option.value)}
                  accent="tertiary"
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">Live check-in visibility</ThemedText>
            <View style={styles.cardList}>
              {PRIVACY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  title={option.title}
                  subtitle={option.subtitle}
                  description={option.description}
                  selected={visibility === option.value}
                  onPress={() => setVisibility(option.value)}
                  accent="secondary"
                />
              ))}
            </View>
          </View>

          {updateProfile.isError && <ThemedText type="small">{getErrorMessage(updateProfile.error)}</ThemedText>}

          <View style={styles.actions}>
            <ThemedButton title="Cancel" variant="ghost" onPress={() => router.back()} />
            <ThemedButton title="Save" onPress={handleSave} loading={updateProfile.isPending} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { marginTop: Spacing.six },
  content: { padding: Spacing.four, gap: Spacing.four },
  group: { gap: Spacing.two },
  cardList: { gap: Spacing.two },
  bioInput: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.three },
  actions: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
});
