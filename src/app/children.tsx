import { router } from 'expo-router';
import { View } from 'react-native';

import { AchievementBadge, Avatar, BackHeader, Button, Card, DemoNote, Row, Screen, Section, Stat, T, usePalette } from '@/components/ui';
import { kidsProgress } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space, tierColors } from '@/theme/theme';

export default function ChildrenScreen() {
  const { children } = useStore();
  const pal = usePalette();
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Дети" />
      {children.map((c) => {
        const metrics = { k_lessons: c.lessons, k_lift: 1, k_green: 0, k_plough: 0 };
        const list = kidsProgress(metrics);
        return (
          <View key={c.id}>
            <Card style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <Avatar name={c.name} frameId="f_pine" size={64} />
              <View style={{ flex: 1 }}>
                <T v="h2">{c.name}</T>
                <T color={base.textDim}>{c.age} лет · детская школа, {c.gear === 'ski' ? 'лыжи' : 'сноуборд'}</T>
              </View>
            </Card>
            <Card style={{ marginTop: space.m }}>
              <Row gap={space.m}>
                <Stat label="занятий" value={String(c.lessons)} color={pal.accentText} />
                <Stat label="наград" value={String(list.filter((x) => x.p.reached.length).length)} />
                <Stat label="инструктор" value="Марина" />
              </Row>
            </Card>
            <Section title="Награды ребёнка">
              <View style={{ gap: space.s }}>
                {list.map(({ a, p }) => (
                  <Card key={a.id} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center', opacity: p.current ? 1 : 0.6 }}>
                    <AchievementBadge icon={a.icon} tier={p.current} locked={!p.current} size={48} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontWeight: '700' }}>{a.title}</T>
                      <T v="small" color={base.textDim}>{a.description}</T>
                    </View>
                    {p.current ? <T v="small" color={tierColors[p.current].main} style={{ fontWeight: '700' }}>{tierColors[p.current].label}</T> : null}
                  </Card>
                ))}
              </View>
            </Section>
          </View>
        );
      })}
      <Button title="Записать ребёнка в школу" icon="calendar" onPress={() => router.push({ pathname: '/booking/[id]', params: { id: 'i2' } })} style={{ marginTop: space.xl }} />
      <Button title="Добавить ребёнка" icon="add" kind="ghost" style={{ marginTop: space.s }} />
      <View style={{ marginTop: space.l }}>
        <DemoNote text="Профиль ребёнка живёт внутри аккаунта родителя: без чатов, без ленты и без геоданных в открытом доступе. Награды — только косметические, их подтверждает инструктор." />
      </View>
    </Screen>
  );
}
