import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { InstructorCard } from '@/components/profile';
import { Card, Chip, DemoNote, Icon, Row, Screen, SeasonToggle, Section, T, usePalette } from '@/components/ui';
import { instructorById, instructors } from '@/data/mock';
import { fmtDate } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space } from '@/theme/theme';

export default function BookScreen() {
  const { season, bookings } = useStore();
  const pal = usePalette();
  const [kids, setKids] = useState(false);
  const [disc, setDisc] = useState<string | null>(null);

  const role = season === 'winter' ? 'instructor' : 'guide';
  const list = instructors.filter((i) => i.role === role && (!kids || i.kids) && (!disc || i.discipline.includes(disc)));
  const disciplines = season === 'winter' ? ['Лыжи', 'Сноуборд'] : ['Походы', 'Восхождения', 'Экскурсии'];
  const active = bookings.filter((b) => b.status !== 'Проведена');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: space.s }}>
        <T v="h1">{season === 'winter' ? 'Инструкторы' : 'Гиды'}</T>
        <SeasonToggle />
      </Row>
      <T color={base.textDim} style={{ marginTop: 4 }}>Заявка уходит менеджеру Архызпарка в Max, он перезванивает и подтверждает время.</T>

      {active.length ? (
        <Section title="Активные заявки">
          <View style={{ gap: space.s }}>
            {active.map((b) => (
              <Card key={b.id} accent={pal.accent} onPress={() => router.push('/bookings')} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
                <Icon name="calendar" size={22} color={pal.accentText} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '700' }}>{instructorById(b.instructorId).name}</T>
                  <T v="small" color={base.textDim}>{fmtDate(b.date)}, {b.time} · {b.format}</T>
                </View>
                <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>{b.status}</T>
              </Card>
            ))}
          </View>
        </Section>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.l, marginHorizontal: -space.l }} contentContainerStyle={{ gap: space.s, paddingHorizontal: space.l }}>
        <Chip label="Работает с детьми" icon="happy-outline" active={kids} onPress={() => setKids(!kids)} />
        {disciplines.map((d) => <Chip key={d} label={d} active={disc === d} onPress={() => setDisc(disc === d ? null : d)} />)}
      </ScrollView>

      <View style={{ gap: space.m, marginTop: space.l }}>
        {list.map((i) => <InstructorCard key={i.id} i={i} />)}
        {list.length === 0 ? <Card><T color={base.textDim}>Никого не нашли. Снимите часть фильтров.</T></Card> : null}
      </View>

      <Card style={{ marginTop: space.l, flexDirection: 'row', gap: space.m, alignItems: 'center' }} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: 'group' } })}>
        <Icon name="briefcase-outline" size={22} color={base.textDim} />
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>Группа или корпоратив</T>
          <T v="small" color={base.textDim}>Индивидуальный расчёт под вашу группу</T>
        </View>
        <Icon name="chevron-forward" size={18} color={base.textMute} />
      </Card>

      <View style={{ marginTop: space.l }}>
        <DemoNote text="Карточки, имена и отзывы — примеры для прототипа, не реальные сотрудники." />
      </View>
    </Screen>
  );
}

