import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader, Icon, T, usePalette } from '@/components/ui';
import { useStore } from '@/logic/store';
import { base, radius, space } from '@/theme/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, sendMessage } = useStore();
  const pal = usePalette();
  const insets = useSafeAreaInsets();
  const c = chats.find((x) => x.id === id) ?? chats[0];
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    sendMessage(c.id, text.trim());
    setText('');
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: base.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.l, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <BackHeader title={c.title} right={<Pressable hitSlop={10}><Icon name="flag-outline" size={20} color={base.textDim} /></Pressable>} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.l, gap: space.s, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        {c.messages.map((m) => {
          if (m.from === 'system') {
            return <T key={m.id} v="label" style={{ textAlign: 'center', marginVertical: space.s }}>{m.text}</T>;
          }
          const me = m.from === 'me';
          return (
            <View key={m.id} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              {!me && c.kind === 'group' ? <T v="label" style={{ marginBottom: 2, marginLeft: 6 }}>{m.author}</T> : null}
              <View style={{ backgroundColor: me ? pal.accent : base.surface2, borderRadius: radius.l, borderBottomRightRadius: me ? 6 : radius.l, borderBottomLeftRadius: me ? radius.l : 6, paddingHorizontal: 14, paddingVertical: 10 }}>
                <T>{m.text}</T>
              </View>
              <T v="label" style={{ alignSelf: me ? 'flex-end' : 'flex-start', marginHorizontal: 6 }}>{m.time}</T>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space.s, padding: space.m, paddingBottom: insets.bottom + space.m, borderTopWidth: 1, borderTopColor: base.border, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Сообщение"
          placeholderTextColor={base.textMute}
          style={{ flex: 1, backgroundColor: base.surface, borderRadius: 22, paddingHorizontal: space.l, height: 44, color: base.text, fontSize: 16, borderWidth: 1, borderColor: base.border }}
        />
        <Pressable onPress={send} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pal.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
