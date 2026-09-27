import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BackHeader, Button, Card, Icon, Row, Screen, T, usePalette } from '@/components/ui';
import { instructorById } from '@/data/mock';
import { fmtDate } from '@/logic/stats';
import { useOnline } from '@/logic/network';
import { useStore } from '@/logic/store';
import { base, space } from '@/theme/theme';

const statusColor = { 'В очереди': base.textDim, 'Отправлена': base.warning, 'Подтверждена': base.blue, 'Проведена': base.green };

export default function BookingsScreen() {
  const { bookings, retryBooking } = useStore();
  const { online } = useOnline();
  const pal = usePalette();
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Мои брони" />
      <View style={{ gap: space.m }}>
        {bookings.map((b) => {
          const i = instructorById(b.instructorId);
          return (
            <Card key={b.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h3">{i.name}</T>
                <T v="small" style={{ fontWeight: '700' }} color={statusColor[b.status]}>{b.status}</T>
              </Row>
              <T v="small" color={base.textDim} style={{ marginTop: 4 }}>
                {fmtDate(b.date, true)}, {b.time} · {b.format} · {b.participants} чел.
              </T>
              {b.comment ? <T v="small" color={base.textMute} style={{ marginTop: 4 }}>{b.comment}</T> : null}
              {b.status === 'В очереди' ? (
                <View style={{ marginTop: space.m, gap: 6 }}>
                  <Row gap={6}>
                    <Icon name={online ? 'sync' : 'cloud-offline-outline'} size={15} color={base.warning} />
                    <T v="small" color={base.warning} style={{ flex: 1 }}>
                      {!online ? 'Ждёт сети, отправится автоматически' : b.lastError ? `${b.lastError}. Попыток: ${b.attempts ?? 0}` : 'Отправляется…'}
                    </T>
                  </Row>
                  {online && b.lastError ? (
                    <Pressable onPress={() => retryBooking(b.id)} hitSlop={8}>
                      <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>Повторить сейчас</T>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {b.status === 'Проведена' ? (
                <Row gap={6} style={{ marginTop: space.m }}>
                  <Icon name="create-outline" size={16} color={pal.accentText} />
                  <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>Оставить отзыв</T>
                </Row>
              ) : null}
            </Card>
          );
        })}
      </View>
      <Button title="Новая запись" icon="add" onPress={() => router.push('/book')} style={{ marginTop: space.xl }} />
      <T v="label" style={{ textAlign: 'center', marginTop: space.s }}>Здесь же в будущем будет онлайн-оплата</T>
    </Screen>
  );
}
