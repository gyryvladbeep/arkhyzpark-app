import { router } from 'expo-router';
import { View } from 'react-native';

import { AchievementBadge, BackHeader, Card, DemoNote, Icon, Row, Screen, Section, T } from '@/components/ui';
import { achievements } from '@/data/achievements';
import { fmtNum, progressOf } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space, tierColors } from '@/theme/theme';

export default function PrizesScreen() {
  const { metrics } = useStore();
  const withPrize = achievements.flatMap((a) => a.tiers.filter((t) => t.prize).map((t) => ({ a, t, got: (metrics[a.metric] ?? 0) >= t.goal })));
  const got = withPrize.filter((x) => x.got);
  const open = withPrize.filter((x) => !x.got);
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Призы" />
      <T color={base.textDim}>Реальные награды за результаты в горах. Выдаются на месте после проверки сотрудником.</T>
      <Section title={`Получено (${got.length})`}>
        {got.length ? got.map(({ a, t }) => (
          <Card key={a.id + t.tier} accent={base.green} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
            <Icon name="gift" size={24} color={base.green} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>{t.prize}</T>
              <T v="small" color={base.textDim}>За «{a.title}». Покажите экран в офисе.</T>
            </View>
          </Card>
        )) : <Card><T color={base.textDim}>Пока нет. Ближайшие — ниже.</T></Card>}
      </Section>
      <Section title="Можно получить">
        <View style={{ gap: space.s }}>
          {open.map(({ a, t }) => {
            const p = progressOf(a, metrics);
            return (
              <Card key={a.id + t.tier} onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
                <AchievementBadge icon={a.icon} tier={t.tier} size={48} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '700' }}>{t.prize}</T>
                  <T v="small" color={base.textDim}>«{a.title}», ступень {tierColors[t.tier].label.toLowerCase()}</T>
                  <T v="label">{a.secret ? 'Условие скрыто' : `${fmtNum(p.value)} / ${fmtNum(t.goal)} ${a.unit ?? ''}`}</T>
                </View>
                {a.partner ? <Row gap={4}><Icon name="business-outline" size={14} color={base.warning} /></Row> : null}
              </Card>
            );
          })}
        </View>
      </Section>
      <View style={{ marginTop: space.l }}>
        <DemoNote text="Позже сюда подключаются партнёры: прокаты, кафе, сервисы. Приз привязан к ступени достижения." />
      </View>
    </Screen>
  );
}
