import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AchievementBadge, Button, Card, Icon, Row, Screen, Stat, T, usePalette } from '@/components/ui';
import type { Achievement, AchievementTier } from '@/data/types';
import { hapticSuccess } from '@/logic/feedback';
import { useStore } from '@/logic/store';
import { base, radius, space, tierColors } from '@/theme/theme';

export type Unlocked = { a: Achievement; t: AchievementTier }[];


export function Finished({ unlocked, lines, onAgain, note }: { unlocked: Unlocked; lines: [string, string][]; onAgain: () => void; note?: string }) {
  const pal = usePalette();
  const { sessions } = useStore();
  useEffect(() => { if (unlocked.length) hapticSuccess(); }, [unlocked.length]);
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: pal.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="checkmark" size={40} color={pal.accentText} />
        </View>
        <T v="h2" style={{ marginTop: space.m }}>Запись сохранена</T>
        <T color={base.textDim} style={{ marginTop: 4 }}>Новая страница уже в дневнике</T>
        {note ? <T v="small" color={base.warning} style={{ marginTop: space.s, textAlign: 'center' }}>{note}</T> : null}
      </View>
      <Card style={{ marginTop: space.xl }}>
        <Row gap={space.m}>
          {lines.map(([l, v]) => <Stat key={l} label={l} value={v} />)}
        </Row>
      </Card>
      <T v="h3" style={{ marginTop: space.xl, marginBottom: space.m }}>
        {unlocked.length ? `Новые награды: ${unlocked.length}` : 'Новых наград пока нет'}
      </T>
      {unlocked.length === 0 ? (
        <Card><T color={base.textDim}>Прогресс по достижениям обновлён. Загляните во вкладку «Награды».</T></Card>
      ) : (
        <View style={{ gap: space.m }}>
          {unlocked.map(({ a, t }) => (
            <Card key={a.id + t.tier} onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })} accent={tierColors[t.tier].main} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <AchievementBadge icon={a.icon} tier={t.tier} size={56} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{a.title}</T>
                <T v="small" color={tierColors[t.tier].main} style={{ fontWeight: '700' }}>{tierColors[t.tier].label}</T>
                {t.prize ? <T v="small" color={base.warning}>Приз: {t.prize}</T> : null}
              </View>
            </Card>
          ))}
        </View>
      )}
      <Button title="Открыть запись" icon="book" onPress={() => router.push({ pathname: '/session/[id]', params: { id: sessions[0].id } })} style={{ marginTop: space.xl }} />
      <Button title="Новая запись" kind="ghost" onPress={onAgain} style={{ marginTop: space.s }} />
      <View style={{ height: 1, marginTop: radius.s }} />
    </Screen>
  );
}
