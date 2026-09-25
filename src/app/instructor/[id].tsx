import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Avatar, BackHeader, Button, Card, Icon, Row, Screen, Section, Stat, T, Tag, usePalette } from '@/components/ui';
import { instructorById } from '@/data/mock';
import { base, space } from '@/theme/theme';

const reviews = [
  { author: 'Екатерина', text: 'Спокойно объясняет, через два занятия ребёнок сам спускался с учебной.', rating: 5 },
  { author: 'Андрей', text: 'Поставил технику поворота за одно утро. Рекомендую.', rating: 5 },
];

export default function InstructorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const i = instructorById(id);
  const pal = usePalette();
  return (
    <Screen bottomPad={40}>
      <BackHeader title={i.role === 'guide' ? 'Гид' : 'Инструктор'} />
      <View style={{ alignItems: 'center' }}>
        <Avatar name={i.name} frameId={i.category === 'Международная' ? 'f_legend' : 'f_basic'} size={104} />
        <T v="h1" style={{ marginTop: space.m }}>{i.name}</T>
        <T color={base.textDim}>{i.discipline.join(', ')}</T>
        <Row gap={6} style={{ marginTop: space.m, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tag text={i.category === 'Международная' ? 'Международная категория' : `Категория ${i.category}`} color={pal.accentText} />
          {i.kids ? <Tag text="Работает с детьми" color={base.green} /> : null}
          <Tag text="Сертифицирован" color={base.textDim} />
        </Row>
      </View>
      <Card style={{ marginTop: space.xl }}>
        <Row gap={space.m}>
          <Stat label="рейтинг" value={i.rating.toFixed(1)} />
          <Stat label="отзывов" value={String(i.reviews)} />
          <Stat label="лет опыта" value={String(i.years)} />
        </Row>
      </Card>
      <Section title="О себе">
        <T color={base.textDim}>{i.about}</T>
        <Row gap={6} style={{ marginTop: space.m }}>
          <Icon name="language-outline" size={16} color={base.textDim} />
          <T v="small" color={base.textDim}>{i.languages.join(', ')}</T>
        </Row>
      </Section>
      <Section title="Свободное время завтра">
        <Row gap={space.s} style={{ flexWrap: 'wrap' }}>
          {i.slots.map((s) => (
            <Card key={s} style={{ paddingVertical: space.s, paddingHorizontal: space.l }} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: i.id, time: s } })}>
              <T style={{ fontWeight: '700' }}>{s}</T>
            </Card>
          ))}
        </Row>
      </Section>
      <Section title="Отзывы">
        <View style={{ gap: space.s }}>
          {reviews.map((r) => (
            <Card key={r.author}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T style={{ fontWeight: '700' }}>{r.author}</T>
                <Row gap={2}>{Array.from({ length: r.rating }, (_, k) => <Icon key={k} name="star" size={12} color={base.warning} />)}</Row>
              </Row>
              <T v="small" color={base.textDim} style={{ marginTop: 4 }}>{r.text}</T>
              <Row gap={4} style={{ marginTop: space.s }}>
                <Icon name="checkmark-circle" size={13} color={base.green} />
                <T v="label" style={{ marginTop: 0 }} color={base.green}>Подтверждённое занятие</T>
              </Row>
            </Card>
          ))}
        </View>
        <T v="label" style={{ marginTop: space.s }}>Оставить отзыв можно только после занятия, которое подтвердил инструктор. Примеры отзывов выдуманы.</T>
      </Section>
      <Button title="Записаться" icon="calendar" onPress={() => router.push({ pathname: '/booking/[id]', params: { id: i.id } })} style={{ marginTop: space.xl, height: 56 }} />
      <Button title="Бесплатная консультация в чате" icon="chatbubble-ellipses" kind="ghost" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: 'c1' } })} style={{ marginTop: space.s }} />
    </Screen>
  );
}
