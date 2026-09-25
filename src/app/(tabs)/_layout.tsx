import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T, usePalette } from '@/components/ui';
import { base } from '@/theme/theme';

type BtnProps = TabTriggerSlotProps & { icon: string; label: string; center?: boolean };

const TabButton = forwardRef<View, BtnProps>(function TabButton({ isFocused, icon, label, center, ...props }, ref) {
  const pal = usePalette();
  if (center) {
    return (
      <Pressable ref={ref} {...props} style={styles.item}>
        <View style={[styles.center, { backgroundColor: pal.accent, shadowColor: pal.accent }]}>
          <Icon name={isFocused ? 'radio-button-on' : 'play'} size={26} color="#fff" />
        </View>
        <T v="label" style={{ marginTop: 2, fontWeight: '700' }} color={isFocused ? pal.accentText : base.textDim}>{label}</T>
      </Pressable>
    );
  }
  return (
    <Pressable ref={ref} {...props} style={styles.item}>
      <Icon name={isFocused ? icon : `${icon}-outline`} size={23} color={isFocused ? pal.accentText : base.textMute} />
      <T v="label" style={{ fontWeight: '600' }} color={isFocused ? pal.accentText : base.textMute}>{label}</T>
    </Pressable>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="book" label="Дневник" />
        </TabTrigger>
        <TabTrigger name="achievements" href="/achievements" asChild>
          <TabButton icon="trophy" label="Награды" />
        </TabTrigger>
        <TabTrigger name="track" href="/track" asChild>
          <TabButton icon="play" label="Трекер" center />
        </TabTrigger>
        <TabTrigger name="book" href="/book" asChild>
          <TabButton icon="people" label="Бронь" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon="person-circle" label="Профиль" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    paddingTop: 8, backgroundColor: 'rgba(10,14,19,0.96)', borderTopWidth: 1, borderTopColor: base.border,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3, maxWidth: 110 },
  center: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: -26,
    borderWidth: 4, borderColor: base.bg, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
