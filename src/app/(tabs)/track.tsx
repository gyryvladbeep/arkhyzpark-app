import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { ElevationChart, ResortMap, ValleyMap } from '@/components/maps';
import { AchievementBadge, Button, Card, Chip, DemoNote, Icon, Row, Screen, SeasonToggle, Stat, T, usePalette } from '@/components/ui';
import { altAt, lifts, pointAlong, routeById, routes, trailById, village } from '@/data/geo';
import { instructorById, makeRun, requiredGear } from '@/data/mock';
import type { Achievement, AchievementTier, Gear, HikeDay, Point, Run } from '@/data/types';
import { fmtKm, fmtMin, fmtNum } from '@/logic/stats';
import { useStore } from '@/logic/store';
import { base, radius, space, tierColors } from '@/theme/theme';

const DEMO_PLAN = ['t3', 't6', 't4', 't3', 't6', 't5', 't6'];
const TICK = 110;
const LIFT_STEPS = 22;
const RUN_STEPS = 38;

type Unlocked = { a: Achievement; t: AchievementTier }[];

export default function TrackScreen() {
  const { season } = useStore();
  return season === 'winter' ? <WinterTracker /> : <SummerTracker />;
}

function Header({ title }: { title: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.s, marginBottom: space.l }}>
      <T v="h1">{title}</T>
      <SeasonToggle />
    </Row>
  );
}

function useElapsed(active: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSec((s) => s + 20), TICK);
    return () => clearInterval(id);
  }, [active]);
  return [sec, setSec] as const;
}

// ---------------- ЗИМА ----------------

function liftFor(trailId: string) {
  const start = trailById(trailId).path[0];
  return [...lifts].sort((a, b) => Math.hypot(a.to[0] - start[0], a.to[1] - start[1]) - Math.hypot(b.to[0] - start[0], b.to[1] - start[1]))[0];
}

function WinterTracker() {
  const { addSession, bookings } = useStore();
  const pal = usePalette();
  const [gear, setGear] = useState<Gear>('ski');
  const withInstructor = bookings.find((b) => b.status !== 'Проведена' && instructorById(b.instructorId).role === 'instructor');
  const [useInstr, setUseInstr] = useState(false);
  const [state, setState] = useState<'idle' | 'run' | 'done'>('idle');
  const [step, setStep] = useState(0);
  const [runs, setRuns] = useState<Run[]>([]);
  const [elapsed, setElapsed] = useElapsed(state === 'run');
  const [result, setResult] = useState<{ unlocked: Unlocked; runs: Run[] } | null>(null);
  const speedRef = useRef(0);

  const cycle = LIFT_STEPS + RUN_STEPS;
  const idx = Math.floor(step / cycle);
  const phaseStep = step % cycle;
  const trailId = DEMO_PLAN[idx % DEMO_PLAN.length];
  const onLift = phaseStep < LIFT_STEPS;
  const lift = liftFor(trailId);
  const marker: Point = onLift
    ? pointAlong([lift.from, lift.to], phaseStep / LIFT_STEPS)
    : pointAlong(trailById(trailId).path, (phaseStep - LIFT_STEPS) / RUN_STEPS);

  useEffect(() => {
    if (state !== 'run') return;
    const id = setInterval(() => {
      setStep((s) => {
        const n = s + 1;
        if (n % cycle === 0) {
          const tId = DEMO_PLAN[(Math.floor(s / cycle)) % DEMO_PLAN.length];
          setRuns((r) => [...r, makeRun(tId, gear === 'snowboard' ? -2 : 3)]);
        }
        return n;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [state, cycle, gear]);

  if (!onLift && state === 'run') {
    const f = (phaseStep - LIFT_STEPS) / RUN_STEPS;
    speedRef.current = Math.round(20 + Math.sin(f * Math.PI) * 38 + (trailById(trailId).level === 'black' ? 8 : 0));
  } else speedRef.current = onLift ? 18 : 0;

  const vertical = runs.reduce((a, r) => a + r.dropM, 0);
  const maxSpeed = Math.max(0, ...runs.map((r) => r.maxSpeed));

  const start = () => {
    setRuns([]);
    setStep(0);
    setElapsed(0);
    setState('run');
  };

  const finish = () => {
    const done = runs.length ? runs : [makeRun(trailId)];
    const unlocked = addSession(
      {
        id: 'w' + Date.now(), season: 'winter', date: new Date().toISOString().slice(0, 10), gear, runs: done,
        totalTimeMin: Math.round(done.reduce((a, r) => a + r.durationSec, 0) / 60 + done.length * 9 + 25), liftTimeMin: done.length * 9,
        instructorId: useInstr ? (withInstructor?.instructorId ?? 'i2') : undefined,
        confirmedByInstructor: false, published: false, isNew: true,
      },
      useInstr ? { lessons: 1 } : undefined,
    );
    setResult({ unlocked, runs: done });
    setState('done');
  };

  if (state === 'done' && result) {
    return <Finished unlocked={result.unlocked} lines={[
      ['спусков', String(result.runs.length)],
      ['вертикаль', `${fmtNum(result.runs.reduce((a, r) => a + r.dropM, 0))} м`],
      ['макс. скорость', `${Math.max(...result.runs.map((r) => r.maxSpeed))} км/ч`],
    ]} onAgain={() => { setState('idle'); setResult(null); }} />;
  }

  return (
    <Screen>
      <Header title="Трекер" />
      {state === 'idle' ? (
        <>
          <Card style={{ flexDirection: 'row', gap: space.m, alignItems: 'center', marginBottom: space.l }} accent={pal.accent}>
            <Icon name="location" size={22} color={pal.accentText} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>Вы на территории курорта</T>
              <T v="small" color={base.textDim}>Напоминание по геозоне. Запись включается вручную.</T>
            </View>
          </Card>
          <T v="small" color={base.textDim} style={{ marginBottom: space.s, fontWeight: '600' }}>СНАРЯЖЕНИЕ</T>
          <Row gap={space.m}>
            {(['ski', 'snowboard'] as const).map((g) => (
              <Pressable key={g} onPress={() => setGear(g)} style={{ flex: 1 }}>
                <Card accent={gear === g ? pal.accent : undefined} style={{ alignItems: 'center', gap: 6, backgroundColor: gear === g ? pal.accentSoft : base.surface }}>
                  <Icon name={g === 'ski' ? 'git-merge' : 'remove'} size={26} color={gear === g ? pal.accentText : base.textDim} />
                  <T style={{ fontWeight: '700' }}>{g === 'ski' ? 'Лыжи' : 'Сноуборд'}</T>
                </Card>
              </Pressable>
            ))}
          </Row>
          <Card style={{ marginTop: space.m, flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Icon name="school-outline" size={20} color={base.textDim} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '600' }}>Занятие с инструктором</T>
              <T v="small" color={base.textDim}>
                {withInstructor ? `${instructorById(withInstructor.instructorId).name}, бронь на ${withInstructor.time}` : 'Нет активных броней. Демо: Марина Л.'}
              </T>
            </View>
            <Switch value={useInstr} onValueChange={setUseInstr} trackColor={{ true: pal.accent, false: base.surface3 }} thumbColor="#fff" />
          </Card>
          <View style={{ marginTop: space.l }}>
            <ResortMap height={280} />
          </View>
          <Button title="Начать катание" icon="play" onPress={start} style={{ marginTop: space.l, height: 58 }} />
          <View style={{ marginTop: space.m }}>
            <DemoNote text="В демо движение моделируется: маркер едет по черновой схеме трасс. В приложении — фоновый GPS и барометр телефона." />
          </View>
        </>
      ) : (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
            <Row gap={6}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: base.danger }} />
              <T v="small" color={base.textDim} style={{ fontWeight: '700' }}>ИДЁТ ЗАПИСЬ · {gear === 'ski' ? 'ЛЫЖИ' : 'СНОУБОРД'}</T>
            </Row>
            <T style={{ fontSize: 64, lineHeight: 76, fontWeight: '800', marginTop: space.m, fontVariant: ['tabular-nums'] }}>{speedRef.current}</T>
            <T color={base.textDim}>км/ч сейчас</T>
            <View style={{ marginTop: space.m, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: pal.accentSoft }}>
              <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>
                {onLift ? `Подъём: ${lift.name}` : `Спуск: «${trailById(trailId).name}»`}
              </T>
            </View>
          </Card>
          <Card style={{ marginTop: space.m }}>
            <Row gap={space.m}>
              <Stat label="спусков" value={String(runs.length)} />
              <Stat label="вертикаль" value={fmtNum(vertical)} unit="м" />
              <Stat label="макс." value={String(maxSpeed)} unit="км/ч" />
            </Row>
            <Row gap={space.m} style={{ marginTop: space.m }}>
              <Stat label="время" value={fmtMin(elapsed / 60)} />
              <Stat label="высота" value={fmtNum(altAt(marker[1]))} unit="м" />
              <Stat label="трасса" value={onLift ? '—' : trailById(trailId).name} />
            </Row>
          </Card>
          <View style={{ marginTop: space.m }}>
            <ResortMap height={260} marker={marker} highlight={[trailId]} />
          </View>
          <Row gap={space.m} style={{ marginTop: space.l }}>
            <Button title="Ускорить" icon="play-forward" kind="ghost" onPress={() => { setRuns((r) => [...r, makeRun(trailId, 3)]); setStep((s) => (Math.floor(s / cycle) + 1) * cycle); }} style={{ flex: 1 }} />
            <Button title="Завершить" icon="stop" kind="danger" onPress={finish} style={{ flex: 1 }} />
          </Row>
        </>
      )}
    </Screen>
  );
}

// ---------------- ЛЕТО ----------------

function SummerTracker() {
  const { addSession, gear: items, metrics } = useStore();
  const pal = usePalette();
  const [routeId, setRouteId] = useState('r1');
  const [share, setShare] = useState(true);
  const [state, setState] = useState<'idle' | 'run' | 'pending' | 'done'>('idle');
  const [f, setF] = useState(0);
  const [resting, setResting] = useState(false);
  const [photos, setPhotos] = useState(0);
  const [day, setDay] = useState(1);
  const [days, setDays] = useState<HikeDay[]>([]);
  const [alts, setAlts] = useState<number[]>([]);
  const [restSec, setRestSec] = useState(0);
  const [elapsed, setElapsed] = useElapsed(state === 'run');
  const [unlocked, setUnlocked] = useState<Unlocked>([]);
  const route = routeById(routeId);

  const req = requiredGear.summer;
  const ready = Math.round((req.filter((id) => items.find((g) => g.id === id)?.packed).length / req.length) * 100);

  // Путь дня: для многодневного — половина маршрута на день
  const dayPath = route.days > 1
    ? (day === 1 ? route.path.slice(0, Math.ceil(route.path.length / 2) + 1) : route.path.slice(Math.ceil(route.path.length / 2)))
    : route.path;
  const marker = pointAlong(dayPath, f);
  const alt = Math.round(1650 + (route.maxAltM - 1650) * (route.days > 1 ? (day === 1 ? f * 0.6 : 0.6 + f * 0.4) : Math.sin(Math.min(1, f * 1.15) * Math.PI / 2)));
  const dayKm = (route.distanceKm / route.days) * f;
  const dayGain = Math.round((route.gainM / route.days) * Math.min(1, f * 1.1));

  useEffect(() => {
    if (state !== 'run') return;
    const id = setInterval(() => {
      if (resting) { setRestSec((r) => r + 20); return; }
      setF((x) => Math.min(1, x + 0.008));
    }, TICK);
    return () => clearInterval(id);
  }, [state, resting]);

  useEffect(() => {
    if (state === 'run') setAlts((a) => [...a.slice(-80), alt]);
  }, [alt, state]);

  const start = () => { setF(0); setElapsed(0); setRestSec(0); setPhotos(0); setAlts([]); setState('run'); };

  const endDay = () => {
    const d: HikeDay = {
      day, distanceKm: +(route.distanceKm / route.days).toFixed(1), gainM: Math.round(route.gainM / route.days), lossM: Math.round(route.gainM / route.days),
      movingMin: Math.round((elapsed - restSec) / 60), restMin: Math.round(restSec / 60), maxAltM: Math.max(...alts, alt),
      photos: Array.from({ length: photos }, (_, i) => ({ caption: `Фото ${i + 1}`, point: marker })),
    };
    const all = [...days, d];
    setDays(all);
    if (day < route.days) {
      setDay(day + 1);
      start();
      return;
    }
    setState('pending');
  };

  const confirmAsGuide = () => {
    const res = addSession(
      {
        id: 's' + Date.now(), season: 'summer', date: new Date().toISOString().slice(0, 10), routeId, guideId: route.days > 1 ? 'g2' : 'g1',
        days, confirmedByGuide: true, published: false, isNew: true,
      },
      ready === 100 ? { readyHikes: 1 } : undefined,
    );
    setUnlocked(res);
    setState('done');
  };

  if (state === 'done') {
    return <Finished unlocked={unlocked} lines={[
      ['км', fmtKm(days.reduce((a, d) => a + d.distanceKm, 0))],
      ['набор', `${fmtNum(days.reduce((a, d) => a + d.gainM, 0))} м`],
      ['фото', String(days.reduce((a, d) => a + d.photos.length, 0))],
    ]} onAgain={() => { setState('idle'); setDays([]); setDay(1); }} />;
  }

  if (state === 'pending') {
    return (
      <Screen>
        <Header title="Маршрут пройден" />
        <Card style={{ alignItems: 'center', gap: space.m, paddingVertical: space.xxl }}>
          <Icon name="hourglass-outline" size={40} color={pal.accentText} />
          <T v="h3">Ожидает подтверждения гида</T>
          <T color={base.textDim} style={{ textAlign: 'center' }}>
            Запись уже в дневнике. Достижения за маршрут засчитываются после подтверждения гидом, чтобы награды были честными.
          </T>
        </Card>
        <Button title="Демо: подтвердить как гид" icon="checkmark-done" onPress={confirmAsGuide} style={{ marginTop: space.l }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Трекер" />
      {state === 'idle' ? (
        <>
          <T v="small" color={base.textDim} style={{ marginBottom: space.s, fontWeight: '600' }}>МАРШРУТ С ГИДОМ АРХЫЗПАРКА</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {routes.map((r) => (
              <Chip key={r.id} label={r.name} active={r.id === routeId} onPress={() => setRouteId(r.id)} />
            ))}
          </View>
          <Card style={{ marginTop: space.m }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="h3">{route.name}</T>
              <T v="small" color={pal.accentText} style={{ fontWeight: '700' }}>{route.difficulty}</T>
            </Row>
            <T v="small" color={base.textDim} style={{ marginTop: 4 }}>{route.description}</T>
            <Row gap={space.m} style={{ marginTop: space.m }}>
              <Stat label="расстояние" value={String(route.distanceKm)} unit="км" />
              <Stat label="набор" value={fmtNum(route.gainM)} unit="м" />
              <Stat label="время" value={route.durationH} />
            </Row>
            {route.requiresMchs ? (
              <Row style={{ marginTop: space.m }} gap={6}>
                <Icon name="shield-checkmark" size={16} color={base.warning} />
                <T v="small" color={base.warning}>Группа регистрируется в МЧС, этим занимается гид</T>
              </Row>
            ) : null}
            <Row style={{ marginTop: space.s }} gap={6}>
              <Icon name="trophy-outline" size={15} color={base.textDim} />
              <T v="small" color={base.textDim}>Пройдено вами: {metrics['route_' + routeId] ?? 0} раз</T>
            </Row>
          </Card>
          <Card style={{ marginTop: space.m }} onPress={() => router.push('/inventory')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <T style={{ fontWeight: '700' }}>Готовность к выходу</T>
                <T v="small" color={base.textDim}>Обязательное снаряжение для маршрута</T>
              </View>
              <T v="num" color={ready === 100 ? base.green : base.warning}>{ready}%</T>
            </Row>
          </Card>
          <Card style={{ marginTop: space.m, flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Icon name="navigate-circle-outline" size={22} color={base.textDim} />
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '600' }}>Передавать координаты гиду</T>
              <T v="small" color={base.textDim}>Гид видит вас на карте, пока идёт запись</T>
            </View>
            <Switch value={share} onValueChange={setShare} trackColor={{ true: pal.accent, false: base.surface3 }} thumbColor="#fff" />
          </Card>
          <View style={{ marginTop: space.l }}>
            <ValleyMap highlight={routeId} height={280} />
          </View>
          <Button title={route.days > 1 ? 'Начать день 1' : 'Начать поход'} icon="play" onPress={start} style={{ marginTop: space.l, height: 58 }} />
          <View style={{ marginTop: space.m }}>
            <DemoNote text="Движение по маршруту моделируется. Многодневный поход пишется отдельной записью на каждый день — так меньше расход батареи." />
          </View>
        </>
      ) : (
        <>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={6}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: resting ? base.warning : base.danger }} />
                <T v="small" color={base.textDim} style={{ fontWeight: '700' }}>
                  {resting ? 'ПРИВАЛ' : 'ИДЁТ ЗАПИСЬ'}{route.days > 1 ? ` · ДЕНЬ ${day} ИЗ ${route.days}` : ''}
                </T>
              </Row>
              {share ? (
                <Row gap={4}>
                  <Icon name="radio-outline" size={14} color={base.green} />
                  <T v="small" color={base.green}>гид видит вас</T>
                </Row>
              ) : null}
            </Row>
            <T v="h3" style={{ marginTop: space.s }}>{route.name}</T>
            <Row gap={space.m} style={{ marginTop: space.m }}>
              <Stat big label="пройдено" value={fmtKm(dayKm)} unit="км" color={pal.accentText} />
              <Stat big label="высота" value={fmtNum(alt)} unit="м" />
            </Row>
            <Row gap={space.m} style={{ marginTop: space.m }}>
              <Stat label="в движении" value={fmtMin((elapsed - restSec) / 60)} />
              <Stat label="привалы" value={fmtMin(restSec / 60)} />
              <Stat label="набор" value={fmtNum(dayGain)} unit="м" />
            </Row>
            <View style={{ marginTop: space.m }}>
              <ElevationChart values={alts} color={pal.accent} height={70} />
            </View>
          </Card>
          <View style={{ marginTop: space.m }}>
            <ValleyMap highlight={routeId} marker={marker} height={240} progress={[village, ...dayPath.filter((_, i) => i / (dayPath.length - 1) <= f), marker]} />
          </View>
          <Row gap={space.s} style={{ marginTop: space.l }}>
            <Button title={`Фото${photos ? ` (${photos})` : ''}`} icon="camera" kind="ghost" onPress={() => setPhotos((p) => p + 1)} style={{ flex: 1 }} />
            <Button title={resting ? 'Идти' : 'Привал'} icon={resting ? 'walk' : 'cafe'} kind="ghost" onPress={() => setResting((r) => !r)} style={{ flex: 1 }} />
          </Row>
          <Row gap={space.s} style={{ marginTop: space.s }}>
            <Button title="Ускорить" icon="play-forward" kind="ghost" onPress={() => setF((x) => Math.min(1, x + 0.25))} style={{ flex: 1 }} />
            <Button title={route.days > 1 && day < route.days ? 'Конец дня' : 'Завершить'} icon="stop" kind="danger" onPress={endDay} style={{ flex: 1 }} />
          </Row>
          <Pressable style={{ marginTop: space.l, alignSelf: 'center' }}>
            <Row gap={6}>
              <Icon name="alert-circle-outline" size={16} color={base.danger} />
              <T v="small" color={base.danger} style={{ fontWeight: '700' }}>Сигнал гиду: нужна помощь</T>
            </Row>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

// ---------------- ИТОГ ----------------

function Finished({ unlocked, lines, onAgain }: { unlocked: Unlocked; lines: [string, string][]; onAgain: () => void }) {
  const pal = usePalette();
  const { sessions } = useStore();
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: pal.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="checkmark" size={40} color={pal.accentText} />
        </View>
        <T v="h2" style={{ marginTop: space.m }}>Запись сохранена</T>
        <T color={base.textDim} style={{ marginTop: 4 }}>Новая страница уже в дневнике</T>
      </View>
      <Card style={{ marginTop: space.xl }}>
        <Row gap={space.m}>
          {lines.map(([l, v]) => <Stat key={l} label={l} value={v} />)}
        </Row>
      </Card>
      <T v="h3" style={{ marginTop: space.xl, marginBottom: space.m }}>
        {unlocked.length ? `Новые награды: ${unlocked.length}` : 'Новых наград пока нет'}
      </T>
      {unlocked.length === 0 ? (
        <Card><T color={base.textDim}>Прогресс по достижениям обновлён. Загляните во вкладку «Награды».</T></Card>
      ) : (
        <View style={{ gap: space.m }}>
          {unlocked.map(({ a, t }) => (
            <Card key={a.id + t.tier} onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })} accent={tierColors[t.tier].main} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <AchievementBadge icon={a.icon} tier={t.tier} size={56} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{a.title}</T>
                <T v="small" color={tierColors[t.tier].main} style={{ fontWeight: '700' }}>{tierColors[t.tier].label}</T>
                {t.prize ? <T v="small" color={base.warning}>Приз: {t.prize}</T> : null}
              </View>
            </Card>
          ))}
        </View>
      )}
      <Button title="Открыть запись" icon="book" onPress={() => router.push({ pathname: '/session/[id]', params: { id: sessions[0].id } })} style={{ marginTop: space.xl }} />
      <Button title="Новая запись" kind="ghost" onPress={onAgain} style={{ marginTop: space.s }} />
      <View style={{ height: 1, marginTop: radius.s }} />
    </Screen>
  );
}
