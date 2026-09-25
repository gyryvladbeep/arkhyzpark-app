import { useState } from 'react';
import { View } from 'react-native';

import { AchievementBadge, BackHeader, Button, Card, DemoNote, Icon, Row, Screen, Section, Stat, T, usePalette } from '@/components/ui';
import { achievementById } from '@/data/achievements';
import { instructorSchedule, pendingForInstructor } from '@/data/mock';
import { useStore } from '@/logic/store';
import { base, space } from '@/theme/theme';

export default function InstructorModeScreen() {
  const { confirmed, confirm } = useStore();
  const pal = usePalette();
  const [rejected, setRejected] = useState<string[]>([]);
  const pending = pendingForInstructor.filter((q) => !confirmed.includes(q.id) && !rejected.includes(q.id));
  return (
    <Screen bottomPad={40}>
      <BackHeader title="Режим инструктора" />
      <Card accent={pal.accent}>
        <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>ДЕМО-ВИД ДЛЯ СОТРУДНИКА</T>
        <T v="h3" style={{ marginTop: 4 }}>Марина Л., категория B</T>
        <Row gap={space.m} style={{ marginTop: space.m }}>
          <Stat label="занятий сегодня" value="2" />
          <Stat label="ждут проверки" value={String(pending.length)} color={pending.length ? base.warning : undefined} />
          <Stat label="рейтинг" value="5,0" />
        </Row>
      </Card>

      <Section title="Расписание на сегодня">
        <Card style={{ padding: space.s }}>
          {instructorSchedule.map((s) => (
            <Row key={s.time} gap={space.m} style={{ padding: space.s }}>
              <T style={{ fontWeight: '800', width: 52 }}>{s.time}</T>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '600' }} color={s.format ? base.text : base.textMute}>{s.client}</T>
                {s.note ? <T v="small" color={base.textDim}>{s.format} · {s.note}</T> : null}
              </View>
              {s.format ? <Icon name="chatbubble-outline" size={18} color={base.textDim} /> : null}
            </Row>
          ))}
        </Card>
      </Section>

      <Section title="Подтвердить результат">
        <View style={{ gap: space.s }}>
          {pending.map((q) => {
            const a = achievementById(q.achievementId);
            return (
              <Card key={q.id}>
                <Row gap={space.m}>
                  <AchievementBadge icon={a.icon} tier="silver" size={44} />
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: '700' }}>{q.client}</T>
                    <T v="small" color={base.textDim}>{q.what} · {q.date}</T>
                  </View>
                </Row>
                <Row gap={space.s} style={{ marginTop: space.m }}>
                  <Button title="Подтвердить" icon="checkmark" onPress={() => confirm(q.id)} style={{ flex: 1, height: 42 }} />
                  <Button title="Рано" kind="ghost" onPress={() => setRejected((r) => [...r, q.id])} style={{ flex: 1, height: 42 }} />
                </Row>
              </Card>
            );
          })}
          {pending.length === 0 ? (
            <Card style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <Icon name="checkmark-done" size={22} color={base.green} />
              <T color={base.textDim}>Всё проверено. Клиенты получили уведомления.</T>
            </Card>
          ) : null}
        </View>
      </Section>
      <View style={{ marginTop: space.l }}>
        <DemoNote text="В релизе это отдельная роль в том же приложении: вход сотрудника, заявки из Max, подтверждение занятий и навыков, групповые чаты походов." />
      </View>
    </Screen>
  );
}
