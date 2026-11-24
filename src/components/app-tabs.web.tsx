import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps, type TabListProps } from 'expo-router/ui';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ChartIcon, GearIcon, LeafIcon, SproutIcon, TreeIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { AppFonts, cardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIcon = (color: string) => ReactNode;

export const TABS: readonly { name: string; href: '/' | '/forest' | '/stats' | '/seeds' | '/settings'; label: string; icon: TabIcon }[] = [
  { name: 'index', href: '/', label: 'Focus', icon: (c) => <LeafIcon size={24} color={c} /> },
  { name: 'forest', href: '/forest', label: 'Forest', icon: (c) => <TreeIcon size={24} color={c} /> },
  { name: 'stats', href: '/stats', label: 'Stats', icon: (c) => <ChartIcon size={22} color={c} /> },
  { name: 'seeds', href: '/seeds', label: 'Seeds', icon: (c) => <SproutIcon size={24} color={c} /> },
  { name: 'settings', href: '/settings', label: 'Settings', icon: (c) => <GearIcon size={23} color={c} accent="transparent" /> },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon}>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: TabIcon }) {
  const theme = useTheme();
  const color = isFocused ? theme.tabActive : theme.tabInactive;
  return (
    <Pressable
      {...(props as unknown as PressableProps)}
      accessibilityRole="tab"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        { backgroundColor: isFocused ? theme.tabActiveBg : 'transparent' },
        pressed && styles.pressed,
      ]}>
      {icon(color)}
      <ThemedText style={[styles.label, { color }]}>{children}</ThemedText>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.listContainer}>
      <View
        style={[
          styles.inner,
          { backgroundColor: theme.tabBar, borderColor: theme.border, boxShadow: cardShadow(theme.shadow, 'raised') },
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  inner: {
    flexDirection: 'row',
    gap: 2,
    padding: 6,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: 560,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 7,
    borderRadius: 20,
  },
  label: { fontFamily: AppFonts.bodyBold, fontSize: 12, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
