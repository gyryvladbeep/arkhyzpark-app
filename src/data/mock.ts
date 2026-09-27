// ДЕМО-ДАННЫЕ. Все имена, отзывы, цифры и история катаний выдуманы для прототипа.
import { trailById } from './geo';
import type {
  BookingRequest, Chat, Child, FeedPost, GearItem, HikeDay, Instructor, Run, SummerSession, WinterSession, Gear,
} from './types';

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const between = (a: number, b: number) => a + rnd() * (b - a);

const speedFor: Record<string, [number, number]> = {
  green: [22, 34],
  blue: [32, 48],
  red: [42, 62],
  black: [45, 68],
};

export function makeRun(trailId: string, boost = 0): Run {
  const tr = trailById(trailId);
  const [a, b] = speedFor[tr.level];
  const maxSpeed = Math.round(between(a, b) + boost);
  const avgSpeed = Math.round(maxSpeed * between(0.45, 0.6));
  const durationSec = Math.round((tr.lengthM / 1000 / avgSpeed) * 3600);
  return { trailId, maxSpeed, avgSpeed, durationSec, dropM: tr.dropM };
}

function winterDay(id: string, date: string, gear: Gear, plan: string[], extra: Partial<WinterSession> = {}): WinterSession {
  const runs = plan.map((t) => makeRun(t));
  const ride = runs.reduce((s, r) => s + r.durationSec, 0) / 60;
  const lift = runs.length * between(7, 11);
  return {
    id, season: 'winter', date, gear, runs,
    liftTimeMin: Math.round(lift),
    totalTimeMin: Math.round(ride + lift + between(40, 90)),
    published: false,
    ...extra,
  };
}

const rep = (arr: string[], n: number) => Array.from({ length: n }, () => arr).flat();

export const initialWinter: WinterSession[] = [
  winterDay('w1', '2026-01-04', 'ski', ['t1', 't1', 't1', 't7', 't7'], { instructorId: 'i2', confirmedByInstructor: true }),
  winterDay('w2', '2026-01-05', 'ski', ['t1', 't7', 't2', 't2', 't7', 't2'], { instructorId: 'i2', confirmedByInstructor: true }),
  winterDay('w3', '2026-01-06', 'ski', rep(['t2', 't3'], 4), { published: true }),
  winterDay('w4', '2026-02-14', 'snowboard', rep(['t2', 't7'], 3), { instructorId: 'i1', confirmedByInstructor: true }),
  winterDay('w5', '2026-02-15', 'snowboard', rep(['t3', 't2', 't4'], 3)),
  winterDay('w6', '2026-02-16', 'ski', rep(['t4', 't5', 't3'], 4), { published: true }),
  winterDay('w7', '2026-03-08', 'ski', rep(['t4', 't6', 't5', 't3'], 3)),
];

function hikeDay(day: number, km: number, gain: number, maxAlt: number, photos: number): HikeDay {
  const moving = Math.round((km / between(2.6, 3.4)) * 60 + gain / 10);
  return {
    day, distanceKm: km, gainM: gain, lossM: gain, movingMin: moving,
    restMin: Math.round(moving * between(0.18, 0.3)), maxAltM: maxAlt,
    photos: Array.from({ length: photos }, (_, i) => ({ caption: `Фото ${i + 1}`, point: [0, 0] as [number, number] })),
  };
}

export const initialSummer: SummerSession[] = [
  { id: 's1', season: 'summer', date: '2026-06-21', routeId: 'r4', guideId: 'g1', days: [hikeDay(1, 6.2, 310, 1910, 4)], confirmedByGuide: true, published: false },
  { id: 's2', season: 'summer', date: '2026-06-22', routeId: 'r2', guideId: 'g1', days: [hikeDay(1, 10.4, 520, 2110, 9)], confirmedByGuide: true, published: true },
  { id: 's3', season: 'summer', date: '2026-07-18', routeId: 'r1', guideId: 'g2', days: [hikeDay(1, 16.3, 760, 2360, 14)], confirmedByGuide: true, published: true },
  { id: 's4', season: 'summer', date: '2026-08-09', routeId: 'r5', guideId: 'g2', days: [hikeDay(1, 14.1, 910, 2560, 11)], confirmedByGuide: true, published: false },
];

// Метрики, которые не выводятся из треков: их подтверждают сотрудники или считает сервер
export const initialManualMetrics: Record<string, number> = {
  lessons: 3,
  skill_plough: 1,
  skill_carving: 0,
  skill_edge: 1,
  skill_freeride: 0,
  reviews: 2,
  referrals: 1,
  earlyBird: 1,
  openingDay: 0,
  dawnStart: 0,
  lastRun: 0,
  rainHike: 0,
  baddukFast: 0,
  readyHikes: 2,
  seasons: 2,
};

export const instructors: Instructor[] = [
  {
    id: 'i1', name: 'Артём К.', role: 'instructor', discipline: ['Сноуборд'], category: 'A', kids: false,
    languages: ['Русский', 'English'], years: 9, rating: 4.9, reviews: 64,
    about: 'Фрирайд и карвинг на сноуборде. Готовит к сертификации, работает с продвинутыми райдерами.',
    slots: ['09:00', '11:00', '14:00'],
  },
  {
    id: 'i2', name: 'Марина Л.', role: 'instructor', discipline: ['Лыжи'], category: 'B', kids: true,
    languages: ['Русский'], years: 6, rating: 5.0, reviews: 88,
    about: 'Детская школа и первые шаги на лыжах. Спокойно и по шагам, без стресса для ребёнка.',
    slots: ['10:00', '12:00', '15:00'],
  },
  {
    id: 'i3', name: 'Тимур Б.', role: 'instructor', discipline: ['Лыжи', 'Сноуборд'], category: 'Международная', kids: true,
    languages: ['Русский', 'English', 'Deutsch'], years: 12, rating: 4.9, reviews: 121,
    about: 'Международная категория. Техника для любого уровня, подготовка к чёрным трассам.',
    slots: ['09:00', '13:00'],
  },
  {
    id: 'i4', name: 'Ольга С.', role: 'instructor', discipline: ['Сноуборд'], category: 'C', kids: true,
    languages: ['Русский'], years: 3, rating: 4.8, reviews: 27,
    about: 'Первый день на доске: стойка, торможение, подъёмники. Работает с детьми от 7 лет.',
    slots: ['10:00', '12:00', '14:00', '16:00'],
  },
  {
    id: 'g1', name: 'Руслан Д.', role: 'guide', discipline: ['Походы', 'Экскурсии'], category: 'A', kids: true,
    languages: ['Русский'], years: 9, rating: 5.0, reviews: 73,
    about: 'Однодневные маршруты по ущельям Архыза. Семейные группы, дети от 8 лет.',
    slots: ['07:00', '08:00'],
  },
  {
    id: 'g2', name: 'Дмитрий В.', role: 'guide', discipline: ['Походы', 'Восхождения'], category: 'Международная', kids: false,
    languages: ['Русский', 'English'], years: 11, rating: 4.9, reviews: 58,
    about: 'Высокогорные и многодневные маршруты, ледник, восхождения. Регистрация группы в МЧС.',
    slots: ['06:00', '07:00'],
  },
];

const anyInstructor: Instructor = {
  id: 'any', name: 'Подберёт менеджер', role: 'instructor', discipline: ['Группы'], category: 'A', kids: true,
  languages: ['Русский'], years: 0, rating: 5, reviews: 0, about: '', slots: [],
};

export const instructorById = (id: string) => instructors.find((i) => i.id === id) ?? anyInstructor;

export const initialBookings: BookingRequest[] = [
  {
    id: 'b1', instructorId: 'i2', date: '2026-01-04', time: '10:00', format: 'Индивидуально', participants: 1,
    phone: '+7 900 000-00-00', comment: 'Первый раз на лыжах', status: 'Проведена', createdAt: '2025-12-20', idempotencyKey: 'demo-b1',
  },
  {
    id: 'b2', instructorId: 'g2', date: '2026-08-09', time: '07:00', format: 'Группа', participants: 3,
    phone: '+7 900 000-00-00', comment: '', status: 'Проведена', createdAt: '2026-08-01', idempotencyKey: 'demo-b2',
  },
];

export const initialChats: Chat[] = [
  {
    id: 'c1', title: 'Марина Л.', kind: 'instructor', subtitle: 'Инструктор, лыжи', members: 2,
    messages: [
      { id: 'm1', from: 'system', text: 'Бронь на 4 января, 10:00 подтверждена', time: '20.12' },
      { id: 'm2', from: 'them', author: 'Марина Л.', text: 'Здравствуйте! Встречаемся у нижней станции гондолы. Ботинки лучше взять в прокате накануне.', time: '20.12' },
      { id: 'm3', from: 'me', text: 'Спасибо, понял. Шлем тоже нужен?', time: '20.12' },
      { id: 'm4', from: 'them', author: 'Марина Л.', text: 'Да, шлем обязательно. Остальное подскажу на месте.', time: '20.12' },
    ],
  },
  {
    id: 'c2', title: 'Семицветное, 9 августа', kind: 'group', subtitle: 'Группа похода, гид Дмитрий В.', members: 7,
    messages: [
      { id: 'm1', from: 'system', text: 'Чат группы создан гидом', time: '01.08' },
      { id: 'm2', from: 'them', author: 'Дмитрий В.', text: 'Сбор в 06:45 у офиса Архызпарка. Проверьте снаряжение по списку в приложении.', time: '01.08' },
      { id: 'm3', from: 'them', author: 'Анна', text: 'Треккинговые палки нужны обязательно?', time: '02.08' },
      { id: 'm4', from: 'them', author: 'Дмитрий В.', text: 'Желательно, на спуске очень помогают. Можно взять в прокате.', time: '02.08' },
    ],
  },
];

export const initialGear: GearItem[] = [
  { id: 'g01', name: 'Рюкзак 30 л', weightG: 1100, season: 'summer', category: 'Основное', have: true, packed: true, rentable: true },
  { id: 'g02', name: 'Треккинговые ботинки', weightG: 1300, season: 'summer', category: 'Обувь', have: true, packed: true, rentable: false },
  { id: 'g03', name: 'Мембранная куртка', weightG: 420, season: 'all', category: 'Одежда', have: true, packed: true, rentable: false },
  { id: 'g04', name: 'Флис', weightG: 350, season: 'all', category: 'Одежда', have: true, packed: false, rentable: false },
  { id: 'g05', name: 'Треккинговые палки', weightG: 480, season: 'summer', category: 'Основное', have: false, packed: false, rentable: true },
  { id: 'g06', name: 'Вода 1,5 л', weightG: 1550, season: 'summer', category: 'Еда и вода', have: true, packed: true, rentable: false },
  { id: 'g07', name: 'Перекус и обед', weightG: 700, season: 'summer', category: 'Еда и вода', have: true, packed: false, rentable: false },
  { id: 'g08', name: 'Аптечка', weightG: 250, season: 'all', category: 'Безопасность', have: true, packed: true, rentable: false },
  { id: 'g09', name: 'Налобный фонарь', weightG: 90, season: 'summer', category: 'Безопасность', have: true, packed: false, rentable: true },
  { id: 'g10', name: 'Солнцезащитные очки', weightG: 40, season: 'all', category: 'Безопасность', have: true, packed: true, rentable: false },
  { id: 'g11', name: 'Горные лыжи', weightG: 3600, season: 'winter', category: 'Снаряжение', have: false, packed: false, rentable: true },
  { id: 'g12', name: 'Горнолыжные ботинки', weightG: 3400, season: 'winter', category: 'Снаряжение', have: true, packed: true, rentable: true },
  { id: 'g13', name: 'Шлем', weightG: 450, season: 'winter', category: 'Безопасность', have: true, packed: true, rentable: true },
  { id: 'g14', name: 'Маска', weightG: 180, season: 'winter', category: 'Безопасность', have: true, packed: true, rentable: true },
  { id: 'g15', name: 'Защита спины', weightG: 600, season: 'winter', category: 'Безопасность', have: false, packed: false, rentable: true },
  { id: 'g16', name: 'Термобельё', weightG: 300, season: 'winter', category: 'Одежда', have: true, packed: true, rentable: false },
  { id: 'g17', name: 'Перчатки', weightG: 200, season: 'winter', category: 'Одежда', have: true, packed: false, rentable: false },
];

// Обязательный минимум для выхода (черновик, настраивает компания)
export const requiredGear: Record<'winter' | 'summer', string[]> = {
  summer: ['g01', 'g02', 'g03', 'g06', 'g08', 'g10', 'g05'],
  winter: ['g11', 'g12', 'g13', 'g14', 'g16', 'g17'],
};

export const initialChildren: Child[] = [
  { id: 'ch1', name: 'Миша', age: 8, gear: 'ski', lessons: 4, badges: ['k_first', 'k_lessons', 'k_lift'] },
];

export const feed: FeedPost[] = [
  {
    id: 'p1', author: 'Анна Р.', title: 'Горный следопыт', frameId: 'f_pine', nameColorId: 'nc_pine', season: 'summer',
    text: 'Семицветное с утра было бирюзовым, к обеду стало почти синим. Гид сказал, так бывает раз в сезон.',
    stats: [{ label: 'км', value: '14,1' }, { label: 'набор', value: '910 м' }, { label: 'в пути', value: '6 ч 40 м' }],
    achievementId: 'r_seven', time: '2 ч назад',
  },
  {
    id: 'p2', author: 'Игорь М.', title: 'Скоростной снег', frameId: 'f_gold', nameColorId: 'nc_gold', season: 'winter',
    text: 'Северная утром по вельвету. Наконец пробил 60.',
    stats: [{ label: 'макс', value: '63 км/ч' }, { label: 'спусков', value: '18' }, { label: 'вертикаль', value: '6 240 м' }],
    achievementId: 'w_speed', time: 'вчера',
  },
  {
    id: 'p3', author: 'Катя Н.', title: 'Лучший ученик', frameId: 'f_ice', nameColorId: 'nc_ice', season: 'winter',
    text: 'Десятое занятие с Ольгой. Первые связки на красной без падений.',
    stats: [{ label: 'спусков', value: '11' }, { label: 'макс', value: '41 км/ч' }],
    achievementId: 's_lessons', time: '3 дня назад',
  },
];

export const pendingForInstructor = [
  { id: 'q1', client: 'Павел Г.', what: 'Навык «Карвинг»', achievementId: 's_carving', date: 'сегодня, 11:00' },
  { id: 'q2', client: 'Миша (ребёнок)', what: 'Навык «Снежинка»', achievementId: 'k_snowflake', date: 'сегодня, 12:00' },
  { id: 'q3', client: 'Ирина Т.', what: 'Занятие проведено, 2 ч', achievementId: 's_lessons', date: 'вчера, 14:00' },
];

export const instructorSchedule = [
  { time: '09:00', client: 'Павел Г.', format: 'Индивидуально', note: 'Карвинг, красные трассы' },
  { time: '12:00', client: 'Миша, 8 лет', format: 'Ребёнок', note: 'Детская школа, занятие 5' },
  { time: '15:00', client: 'Свободно', format: '', note: '' },
];
