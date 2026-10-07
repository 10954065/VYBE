import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { useProfile } from '@/features/profile/use-profile';
import { SessionProvider, useSession } from '@/lib/auth/session-provider';
import { queryClient } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading: isSessionLoading } = useSession();
  const isSignedIn = !!session;
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  if (isSessionLoading || (isSignedIn && isProfileLoading)) {
    return <ThemedView style={{ flex: 1 }} />;
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
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
