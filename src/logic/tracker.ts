// Сервис записи GPS-трека.
//
// Два режима:
// 1. Фоновый (полная сборка приложения): startLocationUpdatesAsync + задача TaskManager.
//    Точки приходят, даже когда экран выключен. На Android при этом висит постоянное
//    уведомление «Идёт запись» — это foreground service, без него система убьёт процесс.
// 2. Экранный (Expo Go и браузер): watchPositionAsync. Работает, пока приложение на экране,
//    поэтому держим экран включённым (keep awake).
//
// Все точки сразу пишутся в буфер в AsyncStorage. Если приложение убили посреди записи,
// при следующем запуске трек можно восстановить.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import type { TrackPoint } from '@/logic/geo-math';

export const TASK_NAME = 'arkhyzpark-location';
const BUFFER_KEY = 'arkhyzpark:track-buffer';
const META_KEY = 'arkhyzpark:track-meta';

export interface TrackMeta {
  startedAt: number;
  season: 'winter' | 'summer';
  mode: 'background' | 'foreground';
  gear?: 'ski' | 'snowboard';
  routeId?: string;
}

// Expo Go — «песочница» из App Store: в ней нет фоновой геолокации
export const isExpoGo = Constants.executionEnvironment === 'storeClient';
export const canUseBackground = Platform.OS !== 'web' && !isExpoGo;

type Listener = (points: TrackPoint[]) => void;
const listeners = new Set<Listener>();
let memory: TrackPoint[] = [];
let watch: Location.LocationSubscription | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function toPoint(l: Location.LocationObject): TrackPoint {
  return {
    lat: l.coords.latitude,
    lon: l.coords.longitude,
    alt: l.coords.altitude,
    acc: l.coords.accuracy,
    speed: l.coords.speed,
    t: l.timestamp,
  };
}

function emit() {
  for (const fn of listeners) fn(memory);
}

// Пишем буфер на диск не чаще раза в 3 секунды: запись на диск — это батарея
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(memory)).catch(() => {});
  }, 3000);
}

function append(points: TrackPoint[]) {
  memory = [...memory, ...points];
  scheduleFlush();
  emit();
}

// Фоновая задача регистрируется на верхнем уровне модуля, до запуска интерфейса:
// система может разбудить приложение только ради неё.
if (canUseBackground) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK_NAME, async ({ data, error }) => {
    if (error || !data) return;
    const pts = data.locations.map(toPoint);
    if (listeners.size) {
      append(pts);
    } else {
      // интерфейса нет (приложение в фоне и выгружено) — дописываем прямо в буфер на диске
      const raw = await AsyncStorage.getItem(BUFFER_KEY);
      const prev: TrackPoint[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify([...prev, ...pts]));
    }
  });
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  fn(memory);
  return () => { listeners.delete(fn); };
}

export async function startTracking(meta: Omit<TrackMeta, 'startedAt' | 'mode'>, useBackground: boolean): Promise<TrackMeta> {
  memory = [];
  await AsyncStorage.setItem(BUFFER_KEY, '[]');
  const full: TrackMeta = { ...meta, startedAt: Date.now(), mode: useBackground ? 'background' : 'foreground' };
  await AsyncStorage.setItem(META_KEY, JSON.stringify(full));

  const common = {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 5, // не чаще, чем каждые 5 м
    timeInterval: 2000, // и не чаще раза в 2 секунды (Android)
  };

  if (useBackground) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      ...common,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false, // iOS не должен сам ставить запись на паузу в очереди к подъёмнику
      showsBackgroundLocationIndicator: true, // синяя плашка на iOS: пользователь видит, что идёт запись
      foregroundService: {
        notificationTitle: 'Архызпарк: идёт запись',
        notificationBody: meta.season === 'winter' ? 'Катание записывается' : 'Поход записывается',
        notificationColor: '#3D9BFF',
      },
    });
  } else {
    // Экран не гаснет — удобно, но не обязательно. Если система отказала (браузер, энергосбережение),
    // запись всё равно должна начаться: второстепенная функция не имеет права ломать основную.
    await activateKeepAwakeAsync('tracker').catch(() => {});
    watch = await Location.watchPositionAsync(common, (l) => append([toPoint(l)]));
  }
  return full;
}

export async function stopTracking(): Promise<TrackPoint[]> {
  if (canUseBackground && (await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false))) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  watch?.remove();
  watch = null;
  deactivateKeepAwake('tracker').catch(() => {});
  // забираем всё, что успело накопиться в буфере на диске (в том числе от фоновой задачи)
  const raw = await AsyncStorage.getItem(BUFFER_KEY);
  const disk: TrackPoint[] = raw ? JSON.parse(raw) : [];
  const all = disk.length > memory.length ? disk : memory;
  await AsyncStorage.multiRemove([BUFFER_KEY, META_KEY]);
  memory = [];
  emit();
  return all;
}

// Незавершённая запись после вылета или принудительного закрытия приложения
export async function findUnfinished(): Promise<{ meta: TrackMeta; points: TrackPoint[] } | null> {
  const [metaRaw, bufRaw] = await Promise.all([AsyncStorage.getItem(META_KEY), AsyncStorage.getItem(BUFFER_KEY)]);
  if (!metaRaw) return null;
  const running = watch !== null || (canUseBackground && (await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false)));
  if (running) return null;
  return { meta: JSON.parse(metaRaw), points: bufRaw ? JSON.parse(bufRaw) : [] };
}

export async function discardUnfinished() {
  await AsyncStorage.multiRemove([BUFFER_KEY, META_KEY]);
}

export async function bufferSize() {
  const raw = await AsyncStorage.getItem(BUFFER_KEY);
  return raw ? (JSON.parse(raw) as unknown[]).length : 0;
}
