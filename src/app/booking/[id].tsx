import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Avatar, BackHeader, Button, Card, Chip, Icon, Row, Screen, T, usePalette } from '@/components/ui';
import { instructorById } from '@/data/mock';
import type { BookingRequest } from '@/data/types';
import { fmtDate } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, radius, space } from '@/theme/theme';

const formats: BookingRequest['format'][] = ['Индивидуально', 'Группа', 'Ребёнок', 'Корпоратив'];

export default function BookingScreen() {
  const { id, time: preTime } = useLocalSearchParams<{ id: string; time?: string }>();
  const { addBooking, children } = useStore();
  const pal = usePalette();
  const group = id === 'group';
  const i = instructorById(group ? 'any' : id);
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() + k + 1);
    return d.toISOString().slice(0, 10);
  });
  const slots = group ? ['09:00', '11:00', '14:00'] : i.slots;
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState(preTime ?? slots[0]);
  const [format, setFormat] = useState<BookingRequest['format']>(group ? 'Корпоратив' : 'Индивидуально');
  const [people, setPeople] = useState(group ? 8 : 1);
  const [phone, setPhone] = useState('+7 ');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    addBooking({
      id: 'b' + Date.now(), instructorId: group ? 'any' : i.id, date, time, format, participants: people,
      phone, comment, status: 'Отправлена', createdAt: new Date().toISOString().slice(0, 10),
    });
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: space.xxl * 2 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: pal.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="paper-plane" size={36} color={pal.accentText} />
          </View>
          <T v="h2" style={{ marginTop: space.l }}>Заявка отправлена</T>
          <T color={base.textDim} style={{ textAlign: 'center', marginTop: space.s }}>
            Менеджер Архызпарка получил её в Max и перезвонит на {phone.trim() || 'ваш номер'}, чтобы подтвердить время. Статус появится в разделе «Мои брони».
          </T>
        </View>
        <Button title="Мои брони" icon="calendar" onPress={() => router.replace('/bookings')} style={{ marginTop: space.xxl }} />
        <Button title="На главную" kind="ghost" onPress={() => router.replace('/')} style={{ marginTop: space.s }} />
      </Screen>
    );
  }

  return (
    <Screen bottomPad={40}>
      <BackHeader title={group ? 'Группа / корпоратив' : 'Запись'} />
      {!group ? (
        <Card style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
          <Avatar name={i.name} frameId="f_basic" size={48} />
          <View style={{ flex: 1 }}>
            <T v="h3">{i.name}</T>
            <T v="small" color={base.textDim}>{i.discipline.join(', ')}</T>
          </View>
        </Card>
      ) : (
        <T color={base.textDim}>Опишите группу — менеджер подберёт инструкторов или гидов и пришлёт расчёт.</T>
      )}

      <Label text="Дата" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.l }} contentContainerStyle={{ gap: space.s, paddingHorizontal: space.l }}>
        {days.map((d) => <Chip key={d} label={fmtDate(d)} active={d === date} onPress={() => setDate(d)} />)}
      </ScrollView>

      <Label text="Время" />
      <Row gap={space.s} style={{ flexWrap: 'wrap' }}>
        {slots.map((s) => <Chip key={s} label={s} active={s === time} onPress={() => setTime(s)} />)}
      </Row>

      <Label text="Формат" />
      <Row gap={space.s} style={{ flexWrap: 'wrap' }}>
        {formats.map((f) => <Chip key={f} label={f} active={f === format} onPress={() => setFormat(f)} />)}
      </Row>
      {format === 'Ребёнок' ? (
        <Card style={{ marginTop: space.s, flexDirection: 'row', gap: space.s, alignItems: 'center' }}>
          <Icon name="happy-outline" size={18} color={base.green} />
          <T v="small">{children[0].name}, {children[0].age} лет — из профиля</T>
        </Card>
      ) : null}

      <Label text="Участников" />
      <Row gap={space.m}>
        <Button title="−" kind="ghost" onPress={() => setPeople(Math.max(1, people - 1))} style={{ width: 50 }} />
        <T v="num" style={{ minWidth: 40, textAlign: 'center' }}>{people}</T>
        <Button title="+" kind="ghost" onPress={() => setPeople(people + 1)} style={{ width: 50 }} />
      </Row>

      <Label text="Телефон" />
      <Input value={phone} onChangeText={setPhone} placeholder="+7 900 000-00-00" keyboardType="phone-pad" />
      <Label text="Комментарий" />
      <Input value={comment} onChangeText={setComment} placeholder="Уровень, пожелания, вопросы" multiline />

      <Button title="Отправить заявку" icon="paper-plane" onPress={submit} disabled={phone.replace(/\D/g, '').length < 11} style={{ marginTop: space.xl, height: 56 }} />
      <T v="label" style={{ textAlign: 'center', marginTop: space.s }}>Без оплаты. Онлайн-оплату добавим позже.</T>
    </Screen>
  );
}

function Label({ text }: { text: string }) {
  return <T v="small" color={base.textDim} style={{ fontWeight: '700', marginTop: space.l, marginBottom: space.s }}>{text.toUpperCase()}</T>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={base.textMute}
      {...props}
      style={{
        backgroundColor: base.surface, borderWidth: 1, borderColor: base.border, borderRadius: radius.m,
        color: base.text, fontSize: 16, paddingHorizontal: space.l, paddingVertical: 14,
        minHeight: props.multiline ? 90 : undefined, textAlignVertical: props.multiline ? 'top' : 'center',
      }}
    />
  );
}
