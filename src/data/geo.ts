import type { Lift, Point, Route, Trail } from './types';

// ЧЕРНОВАЯ схема. Координаты условные (поле 100 x 140), не соответствуют реальной карте курорта.
// Высота считается линейно: верх схемы 2650 м, низ 1650 м.
export const MAP_W = 100;
export const MAP_H = 140;
export const altAt = (y: number) => Math.round(2650 - (y / MAP_H) * 1000);

export const lifts: Lift[] = [
  { id: 'g1', name: 'Гондола «Нижняя»', kind: 'Гондола', from: [30, 128], to: [45, 70] },
  { id: 'g2', name: 'Гондола «Верхняя»', kind: 'Гондола', from: [45, 70], to: [55, 12] },
  { id: 'c3', name: 'Кресельная «Восточная»', kind: 'Кресельная', from: [70, 110], to: [82, 40] },
  { id: 'b4', name: 'Бугельная «Учебная»', kind: 'Бугельная', from: [13, 128], to: [15, 110] },
];

const t = (id: string, name: string, level: Trail['level'], path: Point[], scale = 26): Trail => {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  const drop = altAt(path[0][1]) - altAt(path[path.length - 1][1]);
  return { id, name, level, path, lengthM: Math.round((len * scale) / 10) * 10, dropM: drop };
};

export const trails: Trail[] = [
  t('t1', 'Учебная', 'green', [[15, 110], [11, 117], [14, 122], [13, 128]]),
  t('t2', 'Лесная', 'blue', [[45, 70], [38, 84], [35, 98], [29, 112], [30, 127]]),
  t('t3', 'Панорама', 'blue', [[55, 12], [48, 28], [52, 46], [46, 68]]),
  t('t4', 'Северная', 'red', [[55, 12], [62, 27], [66, 44], [71, 60], [73, 82], [70, 108]]),
  t('t5', 'Восточная', 'red', [[82, 40], [87, 60], [81, 86], [72, 108]]),
  t('t6', 'Кулуар', 'black', [[55, 12], [41, 24], [35, 44], [43, 66]]),
  t('t7', 'Долинная', 'green', [[70, 110], [56, 118], [33, 127]]),
];

export const trailById = (id: string) => trails.find((x) => x.id === id)!;

export const levelName: Record<Trail['level'], string> = {
  green: 'Зелёная',
  blue: 'Синяя',
  red: 'Красная',
  black: 'Чёрная',
};

// Летняя черновая схема долины. Посёлок внизу по центру.
export const village: Point = [50, 132];

export const routes: Route[] = [
  {
    id: 'r1',
    name: 'Баддукские озёра',
    difficulty: 'Средний',
    distanceKm: 16,
    gainM: 750,
    maxAltM: 2350,
    durationH: '6–7 ч',
    days: 1,
    description: 'Три озера в верховьях ущелья Баддук. Тропа идёт через сосновый лес и выходит к альпийским лугам.',
    path: [[50, 132], [44, 118], [36, 104], [30, 88], [22, 72], [18, 58]],
    requiresMchs: false,
  },
  {
    id: 'r2',
    name: 'Софийские водопады',
    difficulty: 'Лёгкий',
    distanceKm: 10,
    gainM: 500,
    maxAltM: 2100,
    durationH: '4–5 ч',
    days: 1,
    description: 'Каскад водопадов под Софийским ледником. Подходит для первого выхода в горы.',
    path: [[50, 132], [58, 118], [64, 104], [70, 92]],
    requiresMchs: false,
  },
  {
    id: 'r3',
    name: 'Софийские озёра',
    difficulty: 'Сложный',
    distanceKm: 18,
    gainM: 1100,
    maxAltM: 2850,
    durationH: '8–9 ч',
    days: 1,
    description: 'Высокогорные озёра на границе леса и скал. Долгий подъём, нужна хорошая форма.',
    path: [[50, 132], [58, 118], [64, 104], [70, 92], [74, 76], [80, 60], [84, 46]],
    requiresMchs: false,
  },
  {
    id: 'r4',
    name: 'Лик Христа',
    difficulty: 'Лёгкий',
    distanceKm: 6,
    gainM: 300,
    maxAltM: 1900,
    durationH: '2–3 ч',
    days: 1,
    description: 'Короткий выход к скальному образу на склоне хребта. Хорош как прогулка в день приезда.',
    path: [[50, 132], [46, 124], [42, 114], [40, 106]],
    requiresMchs: false,
  },
  {
    id: 'r5',
    name: 'Семицветное озеро',
    difficulty: 'Средний',
    distanceKm: 14,
    gainM: 900,
    maxAltM: 2550,
    durationH: '7 ч',
    days: 1,
    description: 'Озеро меняет цвет в зависимости от погоды и времени суток. Панорамы на главный хребет.',
    path: [[50, 132], [54, 118], [52, 100], [56, 84], [54, 66], [58, 52]],
    requiresMchs: false,
  },
  {
    id: 'r6',
    name: 'Софийский ледник, 2 дня',
    difficulty: 'Сложный',
    distanceKm: 28,
    gainM: 1500,
    maxAltM: 3000,
    durationH: '2 дня',
    days: 2,
    description: 'Двухдневный выход с ночёвкой в палатках к языку ледника. Обязательная регистрация в МЧС.',
    path: [[50, 132], [58, 118], [64, 104], [70, 92], [74, 76], [72, 58], [66, 40], [62, 22]],
    requiresMchs: true,
  },
];

export const routeById = (id: string) => routes.find((x) => x.id === id)!;

// Точка на ломаной по доле пройденного пути 0..1
export function pointAlong(path: Point[], f: number): Point {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let target = Math.max(0, Math.min(1, f)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const k = segs[i] === 0 ? 0 : target / segs[i];
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    target -= segs[i];
  }
  return path[path.length - 1];
}
