// Чистые функции обработки GPS-трека. Без импортов из React Native,
// поэтому их легко покрыть unit-тестами и прогнать на записанных GPX-файлах.

export interface TrackPoint {
  lat: number;
  lon: number;
  alt: number | null; // высота, м
  acc: number | null; // точность по горизонтали, м (чем меньше, тем лучше)
  speed: number | null; // скорость от GPS, м/с (может быть null или -1)
  t: number; // время, мс
}

export interface RunSegment {
  from: number; // индекс точки начала спуска
  to: number; // индекс точки конца спуска
  dropM: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  durationSec: number;
  distanceM: number;
}

export const MAX_ACCURACY_M = 35; // точки хуже этой точности выбрасываем
export const MAX_SPEED_KMH = 150; // быстрее на лыжах не бывает: это скачок GPS или подмена
const MIN_RUN_DROP_M = 40; // спуск короче 40 м по вертикали не считаем спуском
const LIFT_RISE_M = 25; // подъём на 25 м означает, что человек снова на подъёмнике
const GAIN_THRESHOLD_M = 4; // шум высоты меньше 4 м игнорируем при подсчёте набора
const REST_SPEED_MS = 0.4; // медленнее — считаем, что человек стоит

export function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// 1. Фильтр: убираем неточные точки, дубли по времени и физически невозможные скачки
export function filterPoints(points: TrackPoint[]): TrackPoint[] {
  const out: TrackPoint[] = [];
  for (const p of points) {
    if (p.acc != null && p.acc > MAX_ACCURACY_M) continue;
    const prev = out[out.length - 1];
    if (prev) {
      const dt = (p.t - prev.t) / 1000;
      if (dt <= 0) continue;
      const v = (distanceM(prev, p) / dt) * 3.6;
      if (v > MAX_SPEED_KMH) continue;
    }
    out.push(p);
  }
  return out;
}

// 2. Сглаживание высоты скользящим средним: GPS-высота «пляшет» на ±10 м
export function smoothAltitudes(points: TrackPoint[], window = 5): number[] {
  const alts = points.map((p) => p.alt);
  return alts.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let k = Math.max(0, i - Math.floor(window / 2)); k <= Math.min(alts.length - 1, i + Math.floor(window / 2)); k++) {
      const a = alts[k];
      if (a != null) { sum += a; n++; }
    }
    return n ? sum / n : 0;
  });
}

// Скорость в точке: берём от GPS, если есть, иначе считаем по соседней точке
export function speedsKmh(points: TrackPoint[]): number[] {
  return points.map((p, i) => {
    if (p.speed != null && p.speed >= 0) return p.speed * 3.6;
    if (i === 0) return 0;
    const dt = (p.t - points[i - 1].t) / 1000;
    return dt > 0 ? (distanceM(points[i - 1], p) / dt) * 3.6 : 0;
  });
}

export function totalDistanceM(points: TrackPoint[]) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += distanceM(points[i - 1], points[i]);
  return d;
}

// 3. Набор и сброс высоты с порогом: без порога шум даёт сотни «лишних» метров
export function gainLoss(alts: number[]) {
  let gain = 0;
  let loss = 0;
  let ref = alts[0] ?? 0;
  for (const a of alts) {
    if (a - ref >= GAIN_THRESHOLD_M) { gain += a - ref; ref = a; }
    else if (ref - a >= GAIN_THRESHOLD_M) { loss += ref - a; ref = a; }
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

// 4. Движение и остановки для похода
export function movingRest(points: TrackPoint[]) {
  const sp = speedsKmh(points);
  let moving = 0;
  let rest = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000;
    if (dt > 600) continue; // разрыв записи больше 10 минут не считаем
    if (sp[i] / 3.6 < REST_SPEED_MS) rest += dt;
    else moving += dt;
  }
  return { movingSec: Math.round(moving), restSec: Math.round(rest) };
}

// 5. Разбивка зимнего дня на спуски: ищем участки, где высота падает минимум на 40 м
export function detectRuns(points: TrackPoint[]): RunSegment[] {
  if (points.length < 3) return [];
  const alts = smoothAltitudes(points);
  const sp = speedsKmh(points);
  const runs: RunSegment[] = [];
  let peak = 0; // индекс локального максимума
  let low = 0; // индекс локального минимума после максимума

  const close = (from: number, to: number) => {
    const drop = alts[from] - alts[to];
    if (drop < MIN_RUN_DROP_M) return;
    const seg = points.slice(from, to + 1);
    const segSpeeds = sp.slice(from, to + 1);
    // медиана по трём соседним точкам убирает одиночные выбросы скорости
    const med = segSpeeds.map((_, i) => {
      const w = segSpeeds.slice(Math.max(0, i - 1), i + 2).sort((x, y) => x - y);
      return w[Math.floor(w.length / 2)];
    });
    const dur = (points[to].t - points[from].t) / 1000;
    const dist = totalDistanceM(seg);
    runs.push({
      from, to,
      dropM: Math.round(drop),
      maxSpeedKmh: Math.round(Math.max(...med)),
      avgSpeedKmh: dur > 0 ? Math.round((dist / dur) * 3.6) : 0,
      durationSec: Math.round(dur),
      distanceM: Math.round(dist),
    });
  };

  for (let i = 1; i < alts.length; i++) {
    // пока не начался спуск, двигаем вершину (допуск 2 м, чтобы вершиной стала последняя точка перед спуском)
    if (low === peak && alts[i] >= alts[peak] - 2) { peak = i; low = i; continue; }
    if (alts[i] < alts[low]) low = i;
    // после спуска начался подъём: закрываем спуск и ищем новый максимум
    if (alts[i] - alts[low] >= LIFT_RISE_M) {
      close(peak, low);
      peak = i;
      low = i;
    }
  }
  close(peak, low);
  return runs;
}

// Прореживание трека для хранения и отрисовки: не больше maxPoints точек
export function downsample<T>(arr: T[], maxPoints = 400): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}

// Приватность: перед публикацией обрезаем первые и последние N метров трека,
// чтобы по карте нельзя было вычислить дом или отель.
export function trimEnds<T extends { lat: number; lon: number }>(points: T[], meters = 200): T[] {
  if (points.length < 3) return [];
  let start = 0;
  let acc = 0;
  while (start < points.length - 1 && acc < meters) { acc += distanceM(points[start], points[start + 1]); start++; }
  let end = points.length - 1;
  acc = 0;
  while (end > start && acc < meters) { acc += distanceM(points[end], points[end - 1]); end--; }
  return end > start ? points.slice(start, end + 1) : [];
}
