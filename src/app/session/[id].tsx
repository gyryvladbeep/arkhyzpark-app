import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ElevationChart, ResortMap, ValleyMap } from '@/components/maps';
import { BackHeader, Button, Card, Chip, Icon, Row, Screen, Section, Stat, T, usePalette } from '@/components/ui';
import { levelName, routeById, trailById } from '@/data/geo';
import { instructorById } from '@/data/mock';
import type { SummerSession, WinterSession } from '@/data/types';
import { diaryText, fmtDate, fmtKm, fmtMin, fmtNum, fmtSec, isWinter, summerSummary, winterSummary } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, radius, space, trailColors } from '@/theme/theme';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useStore();
  const s = sessions.find((x) => x.id === id);
  if (!s) return <Screen><BackHeader title="Запись не найдена" /></Screen>;
  return isWinter(s) ? <WinterView s={s} /> : <SummerView s={s as SummerSession} />;
}

function Publish({ id, published }: { id: string; published: boolean }) {
  const { togglePublish } = useStore();
  const [share, setShare] = useState(false);
  return (
    <>
      <Row gap={space.s} style={{ marginTop: space.xl }}>
        <Button title={published ? 'Убрать из ленты' : 'Опубликовать'} icon={published ? 'eye-off' : 'globe'} kind={published ? 'ghost' : 'primary'} onPress={() => togglePublish(id)} style={{ flex: 1 }} />
        <Button title="Карточка" icon="share-social" kind="ghost" onPress={() => setShare(!share)} style={{ flex: 1 }} />
      </Row>
      <T v="label" style={{ textAlign: 'center', marginTop: space.s }}>
        {published ? 'Запись видна всем в ленте' : 'Запись приватная, видите только вы'}
      </T>
      {share ? <ShareCard id={id} /> : null}
    </>
  );
}

function ShareCard({ id }: { id: string }) {
  const { sessions, userName } = useStore();
  const pal = usePalette();
  const s = sessions.find((x) => x.id === id)!;
  const lines: [string, string][] = isWinter(s)
    ? [[`${winterSummary(s).maxSpeed}`, 'км/ч'], [fmtNum(winterSummary(s).vertical), 'м вниз'], [String(s.runs.length), 'спусков']]
    : [[fmtKm(summerSummary(s as SummerSession).km), 'км'], [fmtNum(summerSummary(s as SummerSession).gain), 'м вверх'], [fmtNum(summerSummary(s as SummerSession).maxAlt), 'м высшая']];
  return (
    <View style={{ marginTop: space.l, borderRadius: radius.xl, padding: space.xl, backgroundColor: pal.sky[0], borderWidth: 1, borderColor: pal.accent }}>
      <T v="small" color={pal.accentText} style={{ fontWeight: '800', letterSpacing: 2 }}>АРХЫЗПАРК</T>
      <T v="h2" style={{ marginTop: space.s }}>{isWinter(s) ? 'Мой день на склоне' : routeById((s as SummerSession).routeId).name}</T>
      <T color={base.textDim}>{userName} · {fmtDate(s.date)}</T>
      <Row style={{ marginTop: space.xl, justifyContent: 'space-between' }}>
        {lines.map(([v, l]) => (
          <View key={l}>
            <T style={{ fontSize: 30, fontWeight: '800' }}>{v}</T>
            <T v="small" color={base.textDim}>{l}</T>
          </View>
        ))}
      </Row>
      <T v="label" style={{ marginTop: space.l }}>Карточка для сторис. В приложении сохраняется картинкой.</T>
    </View>
  );
}

function WinterView({ s }: { s: WinterSession }) {
  const { sessions } = useStore();
  const pal = usePalette();
  const w = winterSummary(s);
  const chron = sessions.filter(isWinter).sort((a, b) => (a.date > b.date ? 1 : -1));
  const txt = diaryText(s, chron.indexOf(s) + 1);
  const [selected, setSelected] = useState<number | null>(null);
  const trailIds = [...new Set(s.runs.map((r) => r.trailId))];
  const hl = selected !== null ? [s.runs[selected].trailId] : trailIds;

  return (
    <Screen bottomPad={40}>
      <BackHeader title={fmtDate(s.date, true)} />
      <T v="h3">{txt.title}</T>
      <T color={base.textDim} style={{ marginTop: 6 }}>{txt.body}</T>

      <View style={{ marginTop: space.l }}>
        <ResortMap highlight={hl} dimOthers height={300} />
      </View>

      <Card style={{ marginTop: space.m }}>
        <Row gap={space.m}>
          <Stat label="макс. скорость" value={String(w.maxSpeed)} unit="км/ч" color={pal.accentText} />
          <Stat label="средняя" value={String(w.avgSpeed)} unit="км/ч" />
          <Stat label="перепад" value={fmtNum(w.vertical)} unit="м" />
        </Row>
        <Row gap={space.m} style={{ marginTop: space.m }}>
          <Stat label="спусков" value={String(w.runs)} />
          <Stat label="время всего" value={fmtMin(s.totalTimeMin)} />
          <Stat label="на спусках" value={fmtMin(w.rideMin)} />
        </Row>
        <Row gap={space.m} style={{ marginTop: space.m }}>
          <Stat label="дистанция" value={fmtKm(w.distanceKm)} unit="км" />
          <Stat label="на подъёмниках" value={fmtMin(s.liftTimeMin)} />
          <Stat label="снаряжение" value={s.gear === 'ski' ? 'Лыжи' : 'Сноуборд'} />
        </Row>
      </Card>

      {s.instructorId ? (
        <Card style={{ marginTop: space.m, flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
          <Icon name={s.confirmedByInstructor ? 'checkmark-circle' : 'time-outline'} size={22} color={s.confirmedByInstructor ? base.green : base.warning} />
          <View style={{ flex: 1 }}>
            <T style={{ fontWeight: '700' }}>Занятие: {instructorById(s.instructorId).name}</T>
            <T v="small" color={base.textDim}>{s.confirmedByInstructor ? 'Инструктор подтвердил занятие' : 'Ждёт подтверждения инструктора'}</T>
          </View>
        </Card>
      ) : null}

      <Section title="Спуски">
        <Card style={{ padding: space.s }}>
          {s.runs.map((r, i) => {
            const t = trailById(r.trailId);
            const active = selected === i;
            return (
              <Pressable key={i} onPress={() => setSelected(active ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.s, borderRadius: radius.s, backgroundColor: active ? pal.accentSoft : 'transparent' }}>
                <T v="small" color={base.textMute} style={{ width: 20 }}>{i + 1}</T>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: trailColors[t.level] }} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '600' }}>{t.name}</T>
                  <T v="label" style={{ marginTop: 0 }}>{levelName[t.level]} · {fmtNum(r.dropM)} м</T>
                </View>
                <T v="small" color={base.textDim}>{fmtSec(r.durationSec)}</T>
                <T v="small" style={{ fontWeight: '700', width: 64, textAlign: 'right' }}>{r.maxSpeed} км/ч</T>
              </Pressable>
            );
          })}
        </Card>
        <T v="label" style={{ marginTop: space.s }}>Нажмите на спуск, чтобы подсветить трассу на схеме</T>
      </Section>

      <Publish id={s.id} published={s.published} />
    </Screen>
  );
}

function SummerView({ s }: { s: SummerSession }) {
  const pal = usePalette();
  const r = routeById(s.routeId);
  const [day, setDay] = useState(0);
  const d = s.days[day] ?? s.days[0];
  const txt = diaryText(s, 1);
  const elev = Array.from({ length: 40 }, (_, i) => {
    const f = i / 39;
    const up = f < 0.55 ? f / 0.55 : 1 - (f - 0.55) / 0.45;
    return 1650 + (d.maxAltM - 1650) * Math.max(0, up) + Math.sin(i * 1.7) * 18;
  });
  return (
    <Screen bottomPad={40}>
      <BackHeader title={fmtDate(s.date, true)} />
      <T v="h3">{txt.title}</T>
      <T color={base.textDim} style={{ marginTop: 6 }}>{txt.body}</T>
      {s.days.length > 1 ? (
        <Row gap={space.s} style={{ marginTop: space.m }}>
          {s.days.map((x, i) => <Chip key={i} label={`День ${x.day}`} active={i === day} onPress={() => setDay(i)} />)}
        </Row>
      ) : null}
      <View style={{ marginTop: space.l }}>
        <ValleyMap highlight={r.id} height={300} />
      </View>
      <Card style={{ marginTop: space.m }}>
        <Row gap={space.m}>
          <Stat label="пройдено" value={fmtKm(d.distanceKm)} unit="км" color={pal.accentText} />
          <Stat label="набор" value={fmtNum(d.gainM)} unit="м" />
          <Stat label="сброс" value={fmtNum(d.lossM)} unit="м" />
        </Row>
        <Row gap={space.m} style={{ marginTop: space.m }}>
          <Stat label="в движении" value={fmtMin(d.movingMin)} />
          <Stat label="привалы" value={fmtMin(d.restMin)} />
          <Stat label="высшая точка" value={fmtNum(d.maxAltM)} unit="м" />
        </Row>
        <T v="small" color={base.textDim} style={{ marginTop: space.l, marginBottom: space.s }}>Профиль высоты</T>
        <ElevationChart values={elev} color={pal.accent} />
      </Card>
      <Card style={{ marginTop: space.m, flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
        <Icon name={s.confirmedByGuide ? 'checkmark-circle' : 'time-outline'} size={22} color={s.confirmedByGuide ? base.green : base.warning} />
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>Гид: {instructorById(s.guideId).name}</T>
          <T v="small" color={base.textDim}>{s.confirmedByGuide ? 'Прохождение маршрута подтверждено' : 'Ждёт подтверждения гида'}</T>
        </View>
      </Card>
      <Section title={`Фото с маршрута (${d.photos.length})`}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          {d.photos.slice(0, 9).map((p, i) => (
            <View key={i} style={{ width: '31.5%', aspectRatio: 1, borderRadius: radius.m, backgroundColor: base.surface2, borderWidth: 1, borderColor: base.border, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon name="image-outline" size={22} color={base.textMute} />
              <T v="label" style={{ marginTop: 0 }}>{fmtNum(1700 + i * 70)} м</T>
            </View>
          ))}
        </View>
        <T v="label" style={{ marginTop: space.s }}>Каждое фото привязано к точке маршрута и высоте</T>
      </Section>
      <Publish id={s.id} published={s.published} />
    </Screen>
  );
}
