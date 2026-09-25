import type { Season, Tier } from '@/theme/theme';

export type Point = [number, number];

export type TrailLevel = 'green' | 'blue' | 'red' | 'black';

export interface Lift {
  id: string;
  name: string;
  kind: 'Гондола' | 'Кресельная' | 'Бугельная';
  from: Point;
  to: Point;
}

export interface Trail {
  id: string;
  name: string;
  level: TrailLevel;
  lengthM: number;
  dropM: number;
  path: Point[];
}

export interface Route {
  id: string;
  name: string;
  difficulty: 'Лёгкий' | 'Средний' | 'Сложный';
  distanceKm: number;
  gainM: number;
  maxAltM: number;
  durationH: string;
  days: number;
  description: string;
  path: Point[];
  requiresMchs: boolean;
}

export type Gear = 'ski' | 'snowboard';

export interface Run {
  trailId: string;
  maxSpeed: number;
  avgSpeed: number;
  durationSec: number;
  dropM: number;
}

export interface WinterSession {
  id: string;
  season: 'winter';
  date: string;
  gear: Gear;
  runs: Run[];
  totalTimeMin: number;
  liftTimeMin: number;
  instructorId?: string;
  confirmedByInstructor?: boolean;
  published: boolean;
  isNew?: boolean;
}

export interface HikeDay {
  day: number;
  distanceKm: number;
  gainM: number;
  lossM: number;
  movingMin: number;
  restMin: number;
  maxAltM: number;
  photos: { caption: string; point: Point }[];
}

export interface SummerSession {
  id: string;
  season: 'summer';
  date: string;
  routeId: string;
  guideId: string;
  days: HikeDay[];
  confirmedByGuide: boolean;
  published: boolean;
  isNew?: boolean;
}

export type Session = WinterSession | SummerSession;

export type Verification = 'auto' | 'instructor' | 'guide';

export type AchievementCategory =
  | 'speed'
  | 'vertical'
  | 'trails'
  | 'routes'
  | 'distance'
  | 'series'
  | 'school'
  | 'kids'
  | 'secret';

export interface AchievementTier {
  tier: Tier;
  goal: number;
  cosmeticId?: string;
  prize?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  season: Season | 'all';
  icon: string;
  metric: string;
  unit?: string;
  tiers: AchievementTier[];
  verification: Verification;
  secret?: boolean;
  partner?: string;
}

export type CosmeticKind = 'frame' | 'title' | 'nameColor' | 'theme' | 'badge';

export interface Cosmetic {
  id: string;
  kind: CosmeticKind;
  name: string;
  color: string;
  color2?: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: 'instructor' | 'guide';
  discipline: string[];
  category: 'A' | 'B' | 'C' | 'Международная';
  kids: boolean;
  languages: string[];
  years: number;
  rating: number;
  reviews: number;
  about: string;
  slots: string[];
}

export interface BookingRequest {
  id: string;
  instructorId: string;
  date: string;
  time: string;
  format: 'Индивидуально' | 'Группа' | 'Ребёнок' | 'Корпоратив';
  participants: number;
  phone: string;
  comment: string;
  status: 'Отправлена' | 'Подтверждена' | 'Проведена';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'them' | 'system';
  author?: string;
  text: string;
  time: string;
}

export interface Chat {
  id: string;
  title: string;
  kind: 'instructor' | 'group';
  subtitle: string;
  members: number;
  messages: ChatMessage[];
}

export interface GearItem {
  id: string;
  name: string;
  weightG: number;
  season: Season | 'all';
  category: string;
  have: boolean;
  packed: boolean;
  rentable: boolean;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  gear: Gear;
  lessons: number;
  badges: string[];
}

export interface FeedPost {
  id: string;
  author: string;
  title: string;
  frameId: string;
  nameColorId: string;
  season: Season;
  text: string;
  stats: { label: string; value: string }[];
  achievementId?: string;
  time: string;
}
