// Настоящий GPS-трекер: разрешения, запись, живая статистика, сохранение в дневник.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';

import { Finished, type Unlocked } from '@/components/finished';
import { TrackView } from '@/components/maps';
import { Button, Card, Chip, Icon, Row, Screen, SeasonToggle, Stat, T, usePalette } from '@/components/ui';
import { routeById, routes } from '@/data/geo';
import type { Gear, Run, Session } from '@/data/types';
import {
  detectRuns, downsample, filterPoints, gainLoss, movingRest, smoothAltitudes, speedsKmh, totalDistanceM, type TrackPoint,
} from '@/logic/geo-math';
import { hapticTap } from '@/logic/feedback';
import { notifyAchievements } from '@/logic/notify';
import { getLocationStatus, openSettings, requestBackground, requestForeground, type LocationStatus } from '@/logic/permissions';
import { fmtKm, fmtMin, fmtNum } from '@/logic/stats';
import { useStore } from '@/logic/store';
import {
  canUseBackground, discardUnfinished, findUnfinished, isExpoGo, startTracking, stopTracking, subscribe, type TrackMeta,
} from '@/logic/tracker';
import { base, space, tierColors } from '@/theme/theme';

type Phase = 'idle' | 'starting' | 'recording' | 'done';

// Из сырых точек собираем запись дневника
function buildSession(meta: Pick<TrackMeta, 'season' | 'gear' | 'routeId' | 'startedAt'>, raw: TrackPoint[]): Session {
  const pts = filterPoints(raw);
  const date = new Date(meta.startedAt).toISOString().slice(0, 10);
  const track = downsample(pts).map((p) => [+p.lat.toFixed(6), +p.lon.toFixed(6), Math.round(p.alt ?? 0)] as [number, number, number]);
  const totalMin = pts.length > 1 ? Math.round((pts[pts.length - 1].t - pts[0].t) / 60000) : 0;
  if (meta.season === 'winter') {
    const runs: Run[] = detectRuns(pts).map((r) => ({
      trailId: 'gps', maxSpeed: r.maxSpeedKmh, avgSpeed: r.avgSpeedKmh, durationSec: r.durationSec, dropM: r.dropM, distanceM: r.distanceM,
    }));
    const rideMin = Math.round(runs.reduce((a, r) => a + r.durationSec, 0) / 60);
    return {
      id: 'g' + meta.startedAt, season: 'winter', source: 'gps', track, date, gear: meta.gear ?? 'ski', runs,
      totalTimeMin: totalMin, liftTimeMin: Math.max(0, totalMin - rideMin), published: false, isNew: true,
    };
  }
  const alts = smoothAltitudes(pts);
  const { gain, loss } = gainLoss(alts);
  const { movingSec, restSec } = movingRest(pts);
  return {
    id: 'g' + meta.startedAt, season: 'summer', source: 'gps', track, date, routeId: meta.routeId ?? 'r1',
    guideId: routeById(meta.routeId ?? 'r1').days > 1 ? 'g2' : 'g1',
    days: [{
      day: 1, distanceKm: +(totalDistanceM(pts) / 1000).toFixed(2), gainM: gain, lossM: loss,
      movingMin: Math.round(movingSec / 60), restMin: Math.round(restSec / 60),
      maxAltM: Math.round(Math.max(0, ...alts)), photos: [],
    }],
    confirmedByGuide: false, published: false, isNew: true,
  };
}

export function GpsTracker({ modeSwitch }: { modeSwitch: ReactNode }) {
  const { season, addSession } = useStore();
  const pal = usePalette();
  const [status, setStatus] = useState<LocationStatus | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [meta, setMeta] = useState<TrackMeta | null>(null);
  const [gear, setGear] = useState<Gear>('ski');
  const [routeId, setRouteId] = useState('r1');
  const [unfinished, setUnfinished] = useState<{ meta: TrackMeta; points: TrackPoint[] } | null>(null);
  const [result, setResult] = useState<{ unlocked: Unlocked; lines: [string, string][]; note?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Статус разрешений проверяем при открытии и каждый раз, когда пользователь вернулся в приложение
  // (например, из системных настроек, где он мог выдать или забрать доступ)
  useEffect(() => {
    const check = () => getLocationStatus().then(setStatus).catch(() => {});
    check();
    findUnfinished().then(setUnfinished).catch(() => {});
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, []);

  useEffect(() => subscribe(setPoints), []);

  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Живая статистика: пересчитываем из точек при каждом обновлении
  const live = useMemo(() => {
    const pts = filterPoints(points);
    const last = points[points.length - 1];
    const sp = speedsKmh(pts);
    const alts = smoothAltitudes(pts);
    const runs = season === 'winter' ? detectRuns(pts) : [];
    return {
      pts,
      rejected: points.length - pts.length,
      speed: sp.length ? Math.round(sp[sp.length - 1]) : 0,
      maxSpeed: runs.length ? Math.max(...runs.map((r) => r.maxSpeedKmh)) : 0,
      runs: runs.length,
      vertical: runs.reduce((a, r) => a + r.dropM, 0),
      km: totalDistanceM(pts) / 1000,
      gain: gainLoss(alts).gain,
      rest: movingRest(pts).restSec,
      alt: alts.length ? Math.round(alts[alts.length - 1]) : null,
      acc: last?.acc != null ? Math.round(last.acc) : null,
    };
  }, [points, season]);

  const start = async () => {
    hapticTap();
    setError(null);
    setPhase('starting');
    try {
      const useBg = canUseBackground && status?.background === 'granted';
      const m = await startTracking({ season, gear, routeId }, useBg);
      setMeta(m);
      setPhase('recording');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось запустить запись');
      setPhase('idle');
    }
  };

  const save = async (m: Pick<TrackMeta, 'season' | 'gear' | 'routeId' | 'startedAt'>, raw: TrackPoint[]) => {
    const pts = filterPoints(raw);
    if (pts.length < 2) {
      setError('Слишком мало точек: запись не сохранена. Проверьте, что GPS поймал сигнал.');
      setPhase('idle');
      return;
    }
    const s = buildSession(m, raw);
    const unlocked = addSession(s);
    notifyAchievements(unlocked.map(({ a, t }) => ({ title: a.title, tier: tierColors[t.tier].label, id: a.id })));
    const lines: [string, string][] = s.season === 'winter'
      ? [['спусков', String(s.runs.length)], ['вертикаль', `${fmtNum(s.runs.reduce((a, r) => a + r.dropM, 0))} м`], ['макс.', `${Math.max(0, ...s.runs.map((r) => r.maxSpeed))} км/ч`]]
      : [['км', fmtKm(s.days[0].distanceKm)], ['набор', `${fmtNum(s.days[0].gainM)} м`], ['в пути', fmtMin(s.days[0].movingMin)]];
    setResult({
      unlocked, lines,
      note: s.season === 'summer' ? 'Награды за маршрут появятся после подтверждения гида' : s.runs.length === 0 ? 'Спусков не найдено: спуск засчитывается от 40 м по вертикали' : undefined,
    });
    setPhase('done');
  };

  const finish = async () => {
    hapticTap();
    const raw = await stopTracking();
    if (meta) await save(meta, raw);
  };

  if (phase === 'done' && result) {
    return <Finished unlocked={result.unlocked} lines={result.lines} note={result.note} onAgain={() => { setResult(null); setPhase('idle'); }} />;
  }

  const header = (
    <Row style={{ justifyContent: 'space-between', marginTop: space.s, marginBottom: space.l }}>
      <T v="h1">Трекер</T>
      {phase === 'idle' ? <SeasonToggle /> : null}
    </Row>
  );

  // ---------- Идёт запись ----------
  if (phase === 'recording' || phase === 'starting') {
    const elapsed = meta ? Math.max(0, Math.round((now - meta.startedAt) / 1000)) : 0;
    const accColor = live.acc == null ? base.textMute : live.acc <= 10 ? base.green : live.acc <= 30 ? base.warning : base.danger;
    return (
      <Screen>
        {header}
        <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
          <Row gap={6}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: base.danger }} />
            <T v="small" color={base.textDim} style={{ fontWeight: '700' }}>
              ИДЁТ ЗАПИСЬ · {meta?.mode === 'background' ? 'ФОНОВЫЙ РЕЖИМ' : 'ЭКРАН НЕ ГАСНЕТ'}
            </T>
          </Row>
          {live.pts.length === 0 ? (
            <T style={{ marginTop: space.l }} color={base.textDim}>Ищем спутники…</T>
          ) : (
            <>
              <T style={{ fontSize: 64, lineHeight: 76, fontWeight: '800', marginTop: space.m, fontVariant: ['tabular-nums'] }}>
                {season === 'winter' ? live.speed : fmtKm(live.km)}
              </T>
              <T color={base.textDim}>{season === 'winter' ? 'км/ч сейчас' : 'км пройдено'}</T>
            </>
          )}
        </Card>
        <Card style={{ marginTop: space.m }}>
          {season === 'winter' ? (
            <Row gap={space.m}>
              <Stat label="спусков" value={String(live.runs)} />
              <Stat label="вертикаль" value={fmtNum(live.vertical)} unit="м" />
              <Stat label="макс." value={String(live.maxSpeed)} unit="км/ч" />
            </Row>
          ) : (
            <Row gap={space.m}>
              <Stat label="набор" value={fmtNum(live.gain)} unit="м" />
              <Stat label="привалы" value={fmtMin(live.rest / 60)} />
              <Stat label="маршрут" value={routeById(routeId).name.split(' ')[0]} />
            </Row>
          )}
          <Row gap={space.m} style={{ marginTop: space.m }}>
            <Stat label="время" value={fmtMin(elapsed / 60)} />
            <Stat label="высота" value={live.alt != null ? fmtNum(live.alt) : '—'} unit="м" />
            <Stat label="точность" value={live.acc != null ? `±${live.acc}` : '—'} unit="м" color={accColor} />
          </Row>
          <T v="label" style={{ marginTop: space.m }}>
            Точек: {points.length}{live.rejected ? `, отброшено как шум: ${live.rejected}` : ''}
          </T>
        </Card>
        <View style={{ marginTop: space.m }}>
          <TrackView points={live.pts} color={pal.accent} height={260} live />
        </View>
        <Button title="Завершить" icon="stop" kind="danger" onPress={finish} disabled={phase === 'starting'} style={{ marginTop: space.l, height: 56 }} />
        {meta?.mode === 'foreground' ? (
          <T v="label" style={{ marginTop: space.s, textAlign: 'center' }}>
            {isExpoGo ? 'В Expo Go запись идёт, пока приложение открыто. Экран не погаснет сам.' : 'Фоновая запись выключена: не сворачивайте приложение.'}
          </T>
        ) : null}
      </Screen>
    );
  }

  // ---------- Ожидание старта ----------
  const fgOk = status?.foreground === 'granted' && status.servicesEnabled;
  return (
    <Screen>
      {header}
      {modeSwitch}

      {unfinished ? (
        <Card accent={base.warning} style={{ marginBottom: space.l }}>
          <Row gap={space.s}>
            <Icon name="alert-circle" size={20} color={base.warning} />
            <T style={{ fontWeight: '700', flex: 1 }}>Найдена незавершённая запись</T>
          </Row>
          <T v="small" color={base.textDim} style={{ marginTop: 4 }}>
            Начата {new Date(unfinished.meta.startedAt).toLocaleString('ru-RU')}, точек: {unfinished.points.length}. Приложение было закрыто во время записи.
          </T>
          <Row gap={space.s} style={{ marginTop: space.m }}>
            <Button title="Сохранить" kind="soft" onPress={async () => { const u = unfinished; setUnfinished(null); await discardUnfinished(); await save(u.meta, u.points); }} style={{ flex: 1, height: 42 }} />
            <Button title="Удалить" kind="ghost" onPress={async () => { await discardUnfinished(); setUnfinished(null); }} style={{ flex: 1, height: 42 }} />
          </Row>
        </Card>
      ) : null}

      <PermissionPanel status={status} onChange={setStatus} />

      {season === 'winter' ? (
        <>
          <T v="small" color={base.textDim} style={{ marginBottom: space.s, marginTop: space.l, fontWeight: '600' }}>СНАРЯЖЕНИЕ</T>
          <Row gap={space.s}>
            <Chip label="Лыжи" active={gear === 'ski'} onPress={() => setGear('ski')} />
            <Chip label="Сноуборд" active={gear === 'snowboard'} onPress={() => setGear('snowboard')} />
          </Row>
        </>
      ) : (
        <>
          <T v="small" color={base.textDim} style={{ marginBottom: space.s, marginTop: space.l, fontWeight: '600' }}>МАРШРУТ</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {routes.map((r) => <Chip key={r.id} label={r.name} active={r.id === routeId} onPress={() => setRouteId(r.id)} />)}
          </View>
        </>
      )}

      {error ? (
        <Card accent={base.danger} style={{ marginTop: space.l }}>
          <T v="small" color={base.danger}>{error}</T>
        </Card>
      ) : null}

      <Button
        title={season === 'winter' ? 'Начать катание' : 'Начать поход'}
        icon="navigate"
        disabled={!fgOk}
        onPress={start}
        style={{ marginTop: space.xl, height: 58 }}
      />
      <T v="label" style={{ marginTop: space.s, textAlign: 'center' }}>
        {fgOk ? 'Можно тестировать дома: на Android-эмуляторе подставьте GPX-трек из папки test-data.' : 'Кнопка станет активной, когда будет доступ к геопозиции.'}
      </T>
    </Screen>
  );
}

// Блок разрешений: объясняем ДО системного диалога и даём понятный выход при отказе
function PermissionPanel({ status, onChange }: { status: LocationStatus | null; onChange: (s: LocationStatus) => void }) {
  const pal = usePalette();
  if (!status) return <Card><T color={base.textDim}>Проверяем доступ к геопозиции…</T></Card>;

  if (!status.servicesEnabled) {
    return (
      <Notice icon="location-outline" color={base.danger} title="Геолокация выключена в телефоне"
        text="Включите службы геолокации в настройках устройства." action="Открыть настройки" onAction={openSettings} />
    );
  }
  if (status.foreground === 'unknown') {
    return (
      <Notice icon="navigate-circle-outline" color={pal.accentText} title="Нужен доступ к геопозиции"
        text="Трекер записывает трассы, скорость и перепад высоты по GPS. Координаты не видны другим, пока вы сами не опубликуете запись."
        action="Разрешить" onAction={async () => onChange(await requestForeground())} />
    );
  }
  if (status.foreground === 'denied') {
    return (
      <Notice icon="close-circle-outline" color={base.warning} title="Доступ к геопозиции не выдан"
        text="Без него трекер не работает. Можно спросить ещё раз." action="Спросить снова" onAction={async () => onChange(await requestForeground())} />
    );
  }
  if (status.foreground === 'blocked') {
    return (
      <Notice icon="lock-closed-outline" color={base.danger} title="Доступ запрещён в настройках"
        text="Система больше не покажет запрос. Откройте настройки приложения и выберите «При использовании» или «Всегда»."
        action="Открыть настройки" onAction={openSettings} />
    );
  }
  return (
    <View style={{ gap: space.s }}>
      <Row gap={space.s}>
        <Icon name="checkmark-circle" size={18} color={base.green} />
        <T v="small" color={base.textDim}>Доступ к геопозиции есть{status.precise ? '' : ', но только приблизительный'}</T>
      </Row>
      {!status.precise ? (
        <Notice icon="warning-outline" color={base.warning} title="Включите точную геопозицию"
          text="С приблизительной геопозицией погрешность до километра: скорость и трассы посчитать нельзя."
          action="Открыть настройки" onAction={openSettings} />
      ) : null}
      {canUseBackground && status.background !== 'granted' ? (
        <Notice icon="moon-outline" color={pal.accentText} title="Запись с выключенным экраном"
          text={Platform.OS === 'android' ? 'Выберите «Разрешить всегда» на следующем экране. Во время записи будет висеть уведомление — так Android не остановит трекер.' : 'Разрешите доступ «Всегда», чтобы телефон мог лежать в кармане.'}
          action={status.background === 'blocked' ? 'Открыть настройки' : 'Разрешить «Всегда»'}
          onAction={async () => { if (status.background === 'blocked') openSettings(); else onChange(await requestBackground()); }} />
      ) : null}
      {isExpoGo ? (
        <Row gap={space.s}>
          <Icon name="information-circle-outline" size={18} color={base.textDim} />
          <T v="small" color={base.textDim} style={{ flex: 1 }}>Expo Go: запись только при открытом приложении. Фоновый режим работает в полной сборке.</T>
        </Row>
      ) : null}
    </View>
  );
}

function Notice({ icon, color, title, text, action, onAction }: { icon: string; color: string; title: string; text: string; action: string; onAction: () => void }) {
  return (
    <Card accent={color}>
      <Row gap={space.s} style={{ alignItems: 'flex-start' }}>
        <Icon name={icon} size={20} color={color} />
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>{title}</T>
          <T v="small" color={base.textDim} style={{ marginTop: 2 }}>{text}</T>
          <Pressable onPress={onAction} style={{ marginTop: space.s }} hitSlop={8}>
            <T v="small" color={color} style={{ fontWeight: '700' }}>{action}</T>
          </Pressable>
        </View>
      </Row>
    </Card>
  );
}
