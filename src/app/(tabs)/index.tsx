import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, Chip, DemoNote, Icon, Ridge, Row, Screen, SeasonToggle, Section, Stat, T, usePalette } from '@/components/ui';
import { levelName, routeById, trailById } from '@/data/geo';
import type { Session } from '@/data/types';
import { diaryText, fmtDate, fmtKm, fmtMin, fmtNum, isSummer, isWinter, summerSummary, winterSummary } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, space, trailColors } from '@/theme/theme';

export default function DiaryScreen() {
  const { season, sessions, userName, level } = useStore();
  const pal = usePalette();
  const list = sessions.filter((s) => s.season === season).sort((a, b) => (a.date < b.date ? 1 : -1));
  const chron = [...list].reverse();
  const indexOf = (s: Session) => chron.indexOf(s) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: base.bg }}>
      <Ridge height={200} />
      <Screen>
        <Row style={{ justifyContent: 'space-between', marginTop: space.s }}>
          <View>
            <T v="small" color={pal.accentText} style={{ fontWeight: '700', letterSpacing: 1 }}>АРХЫЗПАРК</T>
            <T v="h1">Дневник</T>
          </View>
          <SeasonToggle />
        </Row>
        <T color={base.textDim} style={{ marginTop: 4 }}>
          {userName}, уровень {level.level} — {level.name}
        </T>

        <SeasonSummary />

        <Section title={season === 'winter' ? 'Записи сезона 2025/26' : 'Записи лета 2026'}>
          {list.length === 0 ? (
            <Card><T color={base.textDim}>Пока нет записей. Нажмите «Трекер», чтобы начать.</T></Card>
          ) : (
            <View style={{ gap: space.m }}>
              {list.map((s) => <DiaryCard key={s.id} s={s} day={indexOf(s)} />)}
            </View>
          )}
        </Section>

        <View style={{ marginTop: space.xl }}>
          <DemoNote text="Прототип. История катаний и походов сгенерирована для демонстрации. В приложении записи собираются автоматически по GPS." />
        </View>
      </Screen>
    </View>
  );
}

function SeasonSummary() {
  const { season, metrics } = useStore();
  const pal = usePalette();
  return (
    <Card style={{ marginTop: space.l, backgroundColor: 'rgba(18,25,33,0.92)' }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.m }}>
        <T v="small" color={base.textDim} style={{ fontWeight: '600' }}>{season === 'winter' ? 'ИТОГИ СЕЗОНА' : 'ИТОГИ ЛЕТА'}</T>
        <Icon name={season === 'winter' ? 'snow' : 'leaf'} size={16} color={pal.accentText} />
      </Row>
      {season === 'winter' ? (
        <View style={{ gap: space.l }}>
          <Row gap={space.m}>
            <Stat big label="вертикаль" value={fmtNum(metrics.totalVertical)} unit="м" color={pal.accentText} />
            <Stat big label="макс. скорость" value={String(metrics.maxSpeed)} unit="км/ч" />
          </Row>
          <Row gap={space.m}>
            <Stat label="дней" value={String(metrics.skiDays)} />
            <Stat label="спусков" value={String(metrics.totalRuns)} />
            <Stat label="трасс" value={`${metrics.distinctTrails}/7`} />
          </Row>
        </View>
      ) : (
        <View style={{ gap: space.l }}>
          <Row gap={space.m}>
            <Stat big label="пройдено" value={String(metrics.hikeKm)} unit="км" color={pal.accentText} />
            <Stat big label="набор высоты" value={fmtNum(metrics.hikeGain)} unit="м" />
          </Row>
          <Row gap={space.m}>
            <Stat label="выходов" value={String(metrics.hikes)} />
            <Stat label="маршрутов" value={`${metrics.distinctRoutes}/6`} />
            <Stat label="высшая точка" value={fmtNum(metrics.maxAlt)} unit="м" />
          </Row>
        </View>
      )}
    </Card>
  );
}

function DiaryCard({ s, day }: { s: Session; day: number }) {
  const pal = usePalette();
  const txt = diaryText(s, day);
  return (
    <Card onPress={() => router.push({ pathname: '/session/[id]', params: { id: s.id } })} accent={s.isNew ? pal.accent : undefined}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={base.textDim}>{fmtDate(s.date, true)}</T>
        <Row gap={6}>
          {s.isNew ? <Chip label="Новая" active /> : null}
          {s.published ? <Icon name="globe-outline" size={16} color={base.textDim} /> : <Icon name="lock-closed-outline" size={15} color={base.textMute} />}
        </Row>
      </Row>
      <T v="h3" style={{ marginTop: 6 }}>{txt.title}</T>
      <T color={base.textDim} style={{ marginTop: 6 }}>{txt.body}</T>
      <View style={{ height: 1, backgroundColor: base.border, marginVertical: space.m }} />
      {isWinter(s) ? <WinterMini s={s} /> : null}
      {isSummer(s) ? <SummerMini s={s} /> : null}
    </Card>
  );
}

function WinterMini({ s }: { s: Extract<Session, { season: 'winter' }> }) {
  const w = winterSummary(s);
  const levels = [...new Set(s.runs.map((r) => trailById(r.trailId).level))];
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Row gap={space.l}>
        <Mini icon="speedometer-outline" v={`${w.maxSpeed} км/ч`} />
        <Mini icon="trending-down-outline" v={`${fmtNum(w.vertical)} м`} />
        <Mini icon="time-outline" v={fmtMin(s.totalTimeMin)} />
      </Row>
      <Row gap={4}>
        {levels.map((l) => <View key={l} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: trailColors[l] }} accessibilityLabel={levelName[l]} />)}
      </Row>
    </Row>
  );
}

function SummerMini({ s }: { s: Extract<Session, { season: 'summer' }> }) {
  const m = summerSummary(s);
  const r = routeById(s.routeId);
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Row gap={space.l}>
        <Mini icon="footsteps-outline" v={`${fmtKm(m.km)} км`} />
        <Mini icon="trending-up-outline" v={`${fmtNum(m.gain)} м`} />
        <Mini icon="camera-outline" v={String(m.photos)} />
      </Row>
      <T v="small" color={base.textDim}>{r.difficulty}</T>
    </Row>
  );
}

function Mini({ icon, v }: { icon: string; v: string }) {
  return (
    <Row gap={4}>
      <Icon name={icon} size={14} color={base.textDim} />
      <T v="small" style={{ fontWeight: '600' }}>{v}</T>
    </Row>
  );
}
