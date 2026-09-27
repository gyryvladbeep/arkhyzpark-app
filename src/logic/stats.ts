import { achievements, kidsAchievements } from '@/data/achievements';
import { levelName, routeById, trailById } from '@/data/geo';
import { instructorById } from '@/data/mock';
import type { Achievement, AchievementTier, Session, SummerSession, WinterSession } from '@/data/types';
import type { Tier } from '@/theme/theme';

export const isWinter = (s: Session): s is WinterSession => s.season === 'winter';
export const isSummer = (s: Session): s is SummerSession => s.season === 'summer';

export function winterSummary(s: WinterSession) {
  const runs = s.runs.length;
  const vertical = s.runs.reduce((a, r) => a + r.dropM, 0);
  const maxSpeed = Math.max(0, ...s.runs.map((r) => r.maxSpeed));
  const avgSpeed = runs ? Math.round(s.runs.reduce((a, r) => a + r.avgSpeed, 0) / runs) : 0;
  const rideMin = Math.round(s.runs.reduce((a, r) => a + r.durationSec, 0) / 60);
  const distanceKm = s.runs.reduce((a, r) => a + (r.distanceM ?? trailById(r.trailId).lengthM), 0) / 1000;
  const best = [...s.runs].sort((a, b) => b.maxSpeed - a.maxSpeed)[0];
  const fastest = best ? trailById(best.trailId) : undefined;
  const bestRunSec = best ? best.durationSec : 0;
  return { runs, vertical, maxSpeed, avgSpeed, rideMin, distanceKm, fastest, bestRunSec };
}

export function summerSummary(s: SummerSession) {
  const km = s.days.reduce((a, d) => a + d.distanceKm, 0);
  const gain = s.days.reduce((a, d) => a + d.gainM, 0);
  const moving = s.days.reduce((a, d) => a + d.movingMin, 0);
  const rest = s.days.reduce((a, d) => a + d.restMin, 0);
  const maxAlt = Math.max(...s.days.map((d) => d.maxAltM));
  const photos = s.days.reduce((a, d) => a + d.photos.length, 0);
  return { km, gain, moving, rest, maxAlt, photos };
}

const dayNum = (d: string) => Math.round(new Date(d + 'T12:00:00').getTime() / 86400000);

export function computeMetrics(sessions: Session[], manual: Record<string, number>): Record<string, number> {
  const m: Record<string, number> = { ...manual };
  const w = sessions.filter(isWinter);
  const s = sessions.filter(isSummer);
  const allRuns = w.flatMap((x) => x.runs);

  m.maxSpeed = Math.max(0, ...allRuns.map((r) => r.maxSpeed));
  m.maxSpeedBoard = Math.max(0, ...w.filter((x) => x.gear === 'snowboard').flatMap((x) => x.runs).map((r) => r.maxSpeed));
  m.totalVertical = allRuns.reduce((a, r) => a + r.dropM, 0);
  m.bestDayVertical = Math.max(0, ...w.map((x) => x.runs.reduce((a, r) => a + r.dropM, 0)));
  m.totalRuns = allRuns.length;
  m.bestDayRuns = Math.max(0, ...w.map((x) => x.runs.length));
  m.distinctTrails = new Set(allRuns.map((r) => r.trailId).filter((id) => id !== 'gps')).size;
  for (const id of ['t1', 't2', 't3', 't4', 't5', 't6', 't7']) m['run_' + id] = allRuns.filter((r) => r.trailId === id).length;
  const days = [...new Set(w.map((x) => x.date))].sort();
  m.skiDays = days.length;
  let streak = 0, best = 0, prev = -99;
  for (const d of days) {
    const n = dayNum(d);
    streak = n === prev + 1 ? streak + 1 : 1;
    best = Math.max(best, streak);
    prev = n;
  }
  m.winterStreak = best;
  m.winterHours = Math.round(w.reduce((a, x) => a + x.totalTimeMin, 0) / 60);
  m.bothGear = new Set(w.map((x) => x.gear)).size > 1 ? 1 : 0;

  for (const id of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']) m['route_' + id] = s.filter((x) => x.routeId === id && x.confirmedByGuide).length;
  m.distinctRoutes = new Set(s.filter((x) => x.confirmedByGuide).map((x) => x.routeId)).size;
  m.hikeKm = Math.round(s.reduce((a, x) => a + summerSummary(x).km, 0));
  m.hikeGain = s.reduce((a, x) => a + summerSummary(x).gain, 0);
  m.maxAlt = Math.max(0, ...s.map((x) => summerSummary(x).maxAlt));
  m.multiday = s.filter((x) => x.days.length > 1).length;
  m.hikes = s.filter((x) => x.confirmedByGuide).length;
  m.photos = s.reduce((a, x) => a + summerSummary(x).photos, 0);

  const years = (arr: Session[]) => new Set(arr.map((x) => x.date.slice(0, 4)));
  const wy = years(w);
  m.bothSeasons = [...years(s)].some((y) => wy.has(y)) ? 1 : 0;
  m.published = sessions.filter((x) => x.published).length;
  return m;
}

export interface Progress {
  value: number;
  reached: AchievementTier[];
  next?: AchievementTier;
  current?: Tier;
  ratio: number;
}

export function progressOf(a: Achievement, metrics: Record<string, number>): Progress {
  const value = metrics[a.metric] ?? 0;
  const reached = a.tiers.filter((t) => value >= t.goal);
  const next = a.tiers.find((t) => value < t.goal);
  const current = reached.length ? reached[reached.length - 1].tier : undefined;
  const prevGoal = reached.length ? reached[reached.length - 1].goal : 0;
  const ratio = next ? Math.max(0, Math.min(1, (value - prevGoal) / (next.goal - prevGoal))) : 1;
  return { value, reached, next, current, ratio };
}

const tierPoints: Record<Tier, number> = { bronze: 10, silver: 25, gold: 60, legend: 150 };

export function levelOf(metrics: Record<string, number>) {
  let pts = 0;
  let unlocked = 0;
  for (const a of achievements) {
    const p = progressOf(a, metrics);
    unlocked += p.reached.length;
    for (const t of p.reached) pts += tierPoints[t.tier];
  }
  const level = Math.floor(Math.sqrt(pts / 12)) + 1;
  const cur = 12 * (level - 1) ** 2;
  const nxt = 12 * level ** 2;
  const names = ['Гость гор', 'Новичок', 'Любитель', 'Уверенный', 'Опытный', 'Знаток Архыза', 'Мастер склонов', 'Горный ветеран', 'Легенда'];
  return {
    level, pts, unlocked,
    totalTiers: achievements.reduce((a, x) => a + x.tiers.length, 0),
    ratio: (pts - cur) / (nxt - cur),
    toNext: nxt - pts,
    name: names[Math.min(names.length - 1, Math.floor((level - 1) / 2))],
  };
}

// Какие тиры новые при переходе от старых метрик к новым
export function newlyUnlocked(before: Record<string, number>, after: Record<string, number>) {
  const out: { a: Achievement; t: AchievementTier }[] = [];
  for (const a of achievements) {
    for (const t of a.tiers) {
      if ((before[a.metric] ?? 0) < t.goal && (after[a.metric] ?? 0) >= t.goal) out.push({ a, t });
    }
  }
  return out;
}

export function ownedCosmetics(metrics: Record<string, number>, defaults: string[]) {
  const set = new Set(defaults);
  for (const a of achievements) {
    for (const t of progressOf(a, metrics).reached) if (t.cosmeticId) set.add(t.cosmeticId);
  }
  return set;
}

export function kidsProgress(childMetrics: Record<string, number>) {
  return kidsAchievements.map((a) => ({ a, p: progressOf(a, childMetrics) }));
}

// ФОРМАТИРОВАНИЕ
const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const wdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export function fmtDate(d: string, withDay = false) {
  const dt = new Date(d + 'T12:00:00');
  const base = `${dt.getDate()} ${months[dt.getMonth()]}`;
  return withDay ? `${base}, ${wdays[dt.getDay()]}` : base;
}

export const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} ч ${m} м` : `${m} м`;
}

export function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const fmtKm = (km: number) => km.toFixed(1).replace('.', ',');

function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
export const pl = (n: number, forms: [string, string, string]) => `${fmtNum(n)} ${plural(n, ...forms)}`;

// Текст записи дневника, собранный из статистики
export function diaryText(s: Session, dayIndex: number): { title: string; body: string } {
  if (isWinter(s)) {
    const w = winterSummary(s);
    const gear = s.gear === 'ski' ? 'на лыжах' : 'на сноуборде';
    const who = s.instructorId ? ` Занимались с инструктором: ${instructorById(s.instructorId).name}.` : '';
    const trail = !w.fastest ? '' : w.fastest.id === 'gps'
      ? ` Самый быстрый спуск — ${w.maxSpeed} км/ч.`
      : ` Самый быстрый спуск на трассе «${w.fastest.name}» (${levelName[w.fastest.level].toLowerCase()}) — ${w.maxSpeed} км/ч.`;
    const src = s.source === 'gps' ? ' Записано по GPS.' : '';
    return {
      title: `День ${dayIndex}. Катание ${gear}`,
      body: `${pl(w.runs, ['спуск', 'спуска', 'спусков'])} и ${fmtNum(w.vertical)} м вертикали.${trail}${who}${src}`,
    };
  }
  const r = routeById(s.routeId);
  const sum = summerSummary(s);
  const guide = instructorById(s.guideId).name;
  const days = s.days.length > 1 ? ` за ${pl(s.days.length, ['день', 'дня', 'дней'])}` : '';
  return {
    title: `Маршрут: ${r.name}`,
    body: `${fmtKm(sum.km)} км${days} и ${fmtNum(sum.gain)} м набора. Высшая точка — ${fmtNum(sum.maxAlt)} м. Шли с гидом ${guide} — в движении ${fmtMin(sum.moving)}, на привалах ${fmtMin(sum.rest)}.`,
  };
}
