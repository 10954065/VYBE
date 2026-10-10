import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SuspendedScreen } from '@/components/suspended-screen';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useProfile } from '@/features/profile/use-profile';
import { SessionProvider, useSession } from '@/lib/auth/session-provider';
import { queryClient } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();

const VybeNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.backgroundElement,
    text: Colors.text,
    border: Colors.hairline,
    notification: Colors.secondary,
  },
};

function RootNavigator() {
  const { session, isLoading: isSessionLoading } = useSession();
  const isSignedIn = !!session;
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  if (isSessionLoading || (isSignedIn && isProfileLoading)) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (isSignedIn && profile?.suspended_at) {
    return <SuspendedScreen reason={profile.suspended_reason} />;
  }

  const needsOnboarding = isSignedIn && !profile?.onboarding_completed_at;

  return (
    <Stack>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn && needsOnboarding}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn && !needsOnboarding}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={VybeNavigationTheme}>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
