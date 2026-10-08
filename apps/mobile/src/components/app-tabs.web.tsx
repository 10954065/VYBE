import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Colors, Glow, MaxContentWidth, Roundness, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="crews" href="/crews" asChild>
            <TabButton>Crews</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonViewActive]}>
        <ThemedText type="smallBold" themeColor={isFocused ? 'primary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.dock}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
    flexDirection: 'row',
  },
  dock: {
    backgroundColor: 'rgba(18, 19, 28, 0.88)',
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Roundness.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
  },
  tabButton: {
    borderRadius: Roundness.pill,
  },
  pressed: {
    opacity: 0.8,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Roundness.pill,
  },
  tabButtonViewActive: {
    backgroundColor: Colors.backgroundSelected,
    ...Glow.primary,
  },
});
