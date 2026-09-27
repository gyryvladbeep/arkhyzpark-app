import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { ProfileHero } from '@/components/profile';
import { AchievementBadge, Card, Icon, ListItem, Row, Screen, Section, Stat, T, usePalette } from '@/components/ui';
import { achievementById, cosmeticById } from '@/data/achievements';
import { fmtNum, progressOf } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space } from '@/theme/theme';

export default function ProfileScreen() {
  const { equipped, metrics, chats, children, bookings, instructorMode, setInstructorMode, sessions } = useStore();
  const pal = usePalette();
  const th = cosmeticById(equipped.theme);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: space.l }}>
        <ProfileHero />

        <Section title="Витрина" action="Изменить" onAction={() => router.push('/wardrobe')}>
          <Row gap={space.m} style={{ justifyContent: 'space-between' }}>
            {equipped.showcase.map((id) => {
              const a = achievementById(id);
              const p = progressOf(a, metrics);
              return (
                <Card key={id} style={{ flex: 1, alignItems: 'center', padding: space.m, gap: 6 }} onPress={() => router.push({ pathname: '/achievement/[id]', params: { id } })}>
                  <AchievementBadge icon={a.icon} tier={p.current} locked={!p.current} size={52} />
                  <T v="small" style={{ fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>{a.title}</T>
                </Card>
              );
            })}
          </Row>
        </Section>

        <Section title="Всё время">
          <Card>
            <Row gap={space.m}>
              <Stat label="дней на склоне" value={String(metrics.skiDays)} />
              <Stat label="вертикаль" value={fmtNum(metrics.totalVertical)} unit="м" />
              <Stat label="макс." value={String(metrics.maxSpeed)} unit="км/ч" />
            </Row>
            <Row gap={space.m} style={{ marginTop: space.m }}>
              <Stat label="походов" value={String(metrics.hikes)} />
              <Stat label="пройдено" value={String(metrics.hikeKm)} unit="км" />
              <Stat label="сезонов" value={String(metrics.seasons)} />
            </Row>
          </Card>
        </Section>

        <Section title="Разделы">
          <Card style={{ paddingVertical: space.s, paddingHorizontal: space.s }}>
            <ListItem icon="calendar-outline" title="Мои брони" subtitle={`${bookings.length} заявок`} onPress={() => router.push('/bookings')} />
            <ListItem icon="chatbubbles-outline" title="Чаты" subtitle={`${chats.length} диалога`} onPress={() => router.push('/chats')} />
            <ListItem icon="bag-handle-outline" title="Инвентарь" subtitle="Снаряжение и готовность к выходу" onPress={() => router.push('/inventory')} />
            <ListItem icon="happy-outline" title="Дети" subtitle={children.map((c) => `${c.name}, ${c.age} лет`).join(', ')} onPress={() => router.push('/children')} />
            <ListItem icon="color-palette-outline" title="Оформление профиля" subtitle="Рамки, титулы, цвета, темы" onPress={() => router.push('/wardrobe')} />
            <ListItem icon="globe-outline" title="Лента" subtitle={`Опубликовано: ${sessions.filter((s) => s.published).length}`} onPress={() => router.push('/feed')} />
            <ListItem icon="gift-outline" title="Призы" subtitle="Реальные награды за достижения" onPress={() => router.push('/prizes')} />
            <ListItem icon="construct-outline" title="Для тестировщика" subtitle="Разрешения, хранилище, уведомления, сброс данных" onPress={() => router.push('/debug')} />
          </Card>
        </Section>

        <Section title="Для сотрудников">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Icon name="id-card-outline" size={22} color={base.textDim} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>Режим инструктора</T>
              <T v="small" color={base.textDim}>Демо: расписание и подтверждение навыков</T>
            </View>
            <Switch value={instructorMode} onValueChange={(v) => { setInstructorMode(v); if (v) router.push('/instructor-mode'); }} trackColor={{ true: pal.accent, false: base.surface3 }} thumbColor="#fff" />
          </Card>
        </Section>

        <Section title="Приватность">
          <Card>
            <Row gap={space.m}>
              <Icon name="lock-closed-outline" size={20} color={base.textDim} />
              <T v="small" color={base.textDim} style={{ flex: 1 }}>
                Треки и записи приватны по умолчанию. В ленту попадает только то, что вы опубликовали сами. Начало и конец трека на карте скрываются.
              </T>
            </Row>
          </Card>
        </Section>
        <T v="label" style={{ textAlign: 'center', marginTop: space.xl }}>Тема профиля: {th.name}</T>
      </View>
    </Screen>
  );
}

