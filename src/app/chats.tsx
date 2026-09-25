import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, BackHeader, Card, DemoNote, Row, Screen, T } from '@/components/ui';
import { useStore } from '@/logic/store';
import { base, space } from '@/theme/theme';

export default function ChatsScreen() {
  const { chats } = useStore();
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Чаты" />
      <View style={{ gap: space.s }}>
        {chats.map((c) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <Avatar name={c.title} frameId={c.kind === 'group' ? 'f_pine' : 'f_ice'} size={48} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>{c.title}</T>
                  <T v="label" style={{ marginTop: 0 }}>{last.time}</T>
                </Row>
                <T v="small" color={base.textDim}>{c.subtitle}{c.kind === 'group' ? ` · ${c.members} участников` : ''}</T>
                <T v="small" color={base.textMute} numberOfLines={1}>{last.author ? `${last.author}: ` : last.from === 'me' ? 'Вы: ' : ''}{last.text}</T>
              </View>
            </Card>
          );
        })}
      </View>
      <View style={{ marginTop: space.xl }}>
        <DemoNote text="Чат с инструктором открывается после брони. Групповой чат создаёт гид для каждого похода. Только текст, есть жалобы и модерация." />
      </View>
    </Screen>
  );
}
