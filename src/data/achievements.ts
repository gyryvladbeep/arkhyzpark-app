import type { Achievement, Cosmetic } from './types';

export const cosmetics: Cosmetic[] = [
  // Рамки аватара
  { id: 'f_basic', kind: 'frame', name: 'Базовая', color: '#3A4757' },
  { id: 'f_ice', kind: 'frame', name: 'Ледяная', color: '#8EC5FF', color2: '#3D9BFF' },
  { id: 'f_pine', kind: 'frame', name: 'Хвойная', color: '#3CBF73', color2: '#1E6B40' },
  { id: 'f_sun', kind: 'frame', name: 'Летнее солнце', color: '#F2B84B', color2: '#E0703A' },
  { id: 'f_peak', kind: 'frame', name: 'Вершина', color: '#C3CDD8', color2: '#6C7A89' },
  { id: 'f_gold', kind: 'frame', name: 'Золотая вершина', color: '#F2C14E', color2: '#B7862A' },
  { id: 'f_legend', kind: 'frame', name: 'Легенда Архыза', color: '#B08CFF', color2: '#3D9BFF' },
  // Титулы
  { id: 'ti_novice', kind: 'title', name: 'Новичок склона', color: '#94A3B4' },
  { id: 'ti_speed', kind: 'title', name: 'Скоростной снег', color: '#8EC5FF' },
  { id: 'ti_vertical', kind: 'title', name: 'Хозяин вертикали', color: '#8EC5FF' },
  { id: 'ti_allmountain', kind: 'title', name: 'Вся гора', color: '#C3CDD8' },
  { id: 'ti_student', kind: 'title', name: 'Лучший ученик', color: '#F2C14E' },
  { id: 'ti_baddu', kind: 'title', name: 'Покоритель Баддука', color: '#8FE0B0' },
  { id: 'ti_tracker', kind: 'title', name: 'Горный следопыт', color: '#8FE0B0' },
  { id: 'ti_glacier', kind: 'title', name: 'Человек ледника', color: '#B08CFF' },
  { id: 'ti_veteran', kind: 'title', name: 'Ветеран Архыза', color: '#F2C14E' },
  // Цвет имени
  { id: 'nc_white', kind: 'nameColor', name: 'Снег', color: '#EEF3F8' },
  { id: 'nc_ice', kind: 'nameColor', name: 'Лёд', color: '#8EC5FF' },
  { id: 'nc_pine', kind: 'nameColor', name: 'Хвоя', color: '#8FE0B0' },
  { id: 'nc_sunset', kind: 'nameColor', name: 'Закат', color: '#FF9A62' },
  { id: 'nc_gold', kind: 'nameColor', name: 'Золото', color: '#F2C14E' },
  { id: 'nc_aurora', kind: 'nameColor', name: 'Сияние', color: '#C3A6FF' },
  // Темы профиля
  { id: 'th_gondola', kind: 'theme', name: 'Туманная гондола', color: '#1B2D40', color2: '#0A0E13' },
  { id: 'th_valley', kind: 'theme', name: 'Зелёная долина', color: '#143324', color2: '#0A0E13' },
  { id: 'th_night', kind: 'theme', name: 'Ночной склон', color: '#141A44', color2: '#0A0E13' },
  { id: 'th_dawn', kind: 'theme', name: 'Золотой рассвет', color: '#3D2C10', color2: '#0A0E13' },
  { id: 'th_glacier', kind: 'theme', name: 'Ледник', color: '#23304A', color2: '#10151E' },
];

export const defaultCosmetics = ['f_basic', 'ti_novice', 'nc_white', 'th_gondola'];

export const cosmeticById = (id: string) => cosmetics.find((c) => c.id === id)!;

export const kindName: Record<Cosmetic['kind'], string> = {
  frame: 'Рамки',
  title: 'Титулы',
  nameColor: 'Цвет имени',
  theme: 'Темы профиля',
  badge: 'Бейджи',
};

export const categoryName: Record<Achievement['category'], string> = {
  speed: 'Скорость',
  vertical: 'Вертикаль',
  trails: 'Трассы',
  routes: 'Маршруты',
  distance: 'Километры',
  series: 'Серии',
  school: 'Школа',
  kids: 'Дети',
  secret: 'Секретные',
};

export const achievements: Achievement[] = [
  // ЗИМА — скорость
  {
    id: 'w_speed', title: 'Скорость ветра', description: 'Максимальная скорость на спуске.',
    category: 'speed', season: 'winter', icon: 'speedometer', metric: 'maxSpeed', unit: 'км/ч', verification: 'auto',
    tiers: [
      { tier: 'bronze', goal: 40 },
      { tier: 'silver', goal: 50, cosmeticId: 'nc_ice' },
      { tier: 'gold', goal: 60, cosmeticId: 'ti_speed', prize: 'Скидка 15% на прокат снаряжения' },
      { tier: 'legend', goal: 75, cosmeticId: 'f_legend' },
    ],
  },
  {
    id: 'w_speed_board', title: 'Доска на пределе', description: 'Максимальная скорость на сноуборде.',
    category: 'speed', season: 'winter', icon: 'flash', metric: 'maxSpeedBoard', unit: 'км/ч', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 40 }, { tier: 'silver', goal: 50 }, { tier: 'gold', goal: 60 }],
  },
  // ЗИМА — вертикаль
  {
    id: 'w_vertical', title: 'Хозяин вертикали', description: 'Суммарный перепад высоты за все спуски.',
    category: 'vertical', season: 'winter', icon: 'trending-down', metric: 'totalVertical', unit: 'м', verification: 'auto',
    tiers: [
      { tier: 'bronze', goal: 5000 },
      { tier: 'silver', goal: 20000, cosmeticId: 'th_night' },
      { tier: 'gold', goal: 50000, cosmeticId: 'ti_vertical' },
      { tier: 'legend', goal: 100000, cosmeticId: 'f_gold' },
    ],
  },
  {
    id: 'w_vertical_day', title: 'Вертикальный день', description: 'Перепад высоты за один день катания.',
    category: 'vertical', season: 'winter', icon: 'analytics', metric: 'bestDayVertical', unit: 'м', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 3000 }, { tier: 'silver', goal: 5000 }, { tier: 'gold', goal: 8000 }],
  },
  // ЗИМА — спуски и трассы
  {
    id: 'w_runs', title: 'Спуск за спуском', description: 'Общее число спусков.',
    category: 'trails', season: 'winter', icon: 'repeat', metric: 'totalRuns', unit: 'спусков', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 25 }, { tier: 'silver', goal: 100 }, { tier: 'gold', goal: 300 }, { tier: 'legend', goal: 1000 }],
  },
  {
    id: 'w_runs_day', title: 'Марафон склона', description: 'Спусков за один день.',
    category: 'trails', season: 'winter', icon: 'stopwatch', metric: 'bestDayRuns', unit: 'спусков', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 10 }, { tier: 'silver', goal: 20 }, { tier: 'gold', goal: 30 }],
  },
  {
    id: 'w_all_trails', title: 'Вся гора', description: 'Проехать разные трассы курорта.',
    category: 'trails', season: 'winter', icon: 'git-network', metric: 'distinctTrails', unit: 'трасс', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 3 }, { tier: 'silver', goal: 5 }, { tier: 'gold', goal: 7, cosmeticId: 'ti_allmountain' }],
  },
  {
    id: 'w_black', title: 'Кулуар покорён', description: 'Спуски по чёрной трассе «Кулуар».',
    category: 'trails', season: 'winter', icon: 'triangle', metric: 'run_t6', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 10 }, { tier: 'gold', goal: 25, cosmeticId: 'f_peak' }],
  },
  {
    id: 'w_trail_north', title: 'Северная', description: 'Покорить красную трассу «Северная» N раз.',
    category: 'trails', season: 'winter', icon: 'flag', metric: 'run_t4', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 5 }, { tier: 'silver', goal: 25 }, { tier: 'gold', goal: 50 }],
  },
  {
    id: 'w_trail_east', title: 'Восточная', description: 'Покорить красную трассу «Восточная» N раз.',
    category: 'trails', season: 'winter', icon: 'flag', metric: 'run_t5', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 5 }, { tier: 'silver', goal: 25 }, { tier: 'gold', goal: 50 }],
  },
  {
    id: 'w_trail_panorama', title: 'Панорама', description: 'Покорить синюю трассу «Панорама» N раз.',
    category: 'trails', season: 'winter', icon: 'flag', metric: 'run_t3', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 5 }, { tier: 'silver', goal: 25 }, { tier: 'gold', goal: 50 }],
  },
  {
    id: 'w_trail_forest', title: 'Лесная', description: 'Покорить синюю трассу «Лесная» N раз.',
    category: 'trails', season: 'winter', icon: 'flag', metric: 'run_t2', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 5 }, { tier: 'silver', goal: 25 }, { tier: 'gold', goal: 50 }],
  },
  // ЗИМА — серии и время
  {
    id: 'w_days', title: 'Сезон на склоне', description: 'Дней катания за сезон.',
    category: 'series', season: 'winter', icon: 'calendar', metric: 'skiDays', unit: 'дней', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 3 }, { tier: 'silver', goal: 7 }, { tier: 'gold', goal: 15 }, { tier: 'legend', goal: 30 }],
  },
  {
    id: 'w_streak', title: 'Без выходных', description: 'Дней катания подряд.',
    category: 'series', season: 'winter', icon: 'flame', metric: 'winterStreak', unit: 'дней', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 3 }, { tier: 'silver', goal: 5 }, { tier: 'gold', goal: 7 }],
  },
  {
    id: 'w_hours', title: 'Часы на снегу', description: 'Общее время катания.',
    category: 'series', season: 'winter', icon: 'time', metric: 'winterHours', unit: 'ч', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 10 }, { tier: 'silver', goal: 30 }, { tier: 'gold', goal: 60 }, { tier: 'legend', goal: 120 }],
  },
  {
    id: 'w_both', title: 'Две доски', description: 'Кататься и на лыжах, и на сноуборде.',
    category: 'series', season: 'winter', icon: 'swap-horizontal', metric: 'bothGear', verification: 'auto',
    tiers: [{ tier: 'gold', goal: 1 }],
  },
  // ШКОЛА — подтверждает инструктор
  {
    id: 's_lessons', title: 'Ученик', description: 'Занятия с инструктором Архызпарка.',
    category: 'school', season: 'winter', icon: 'school', metric: 'lessons', unit: 'занятий', verification: 'instructor',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 5 }, { tier: 'gold', goal: 10, cosmeticId: 'ti_student' }, { tier: 'legend', goal: 20 }],
  },
  {
    id: 's_plough', title: 'Первый поворот', description: 'Уверенный поворот плугом. Навык подтверждает инструктор.',
    category: 'school', season: 'winter', icon: 'return-down-forward', metric: 'skill_plough', verification: 'instructor',
    tiers: [{ tier: 'bronze', goal: 1 }],
  },
  {
    id: 's_carving', title: 'Карвинг', description: 'Резаные дуги на красной трассе. Навык подтверждает инструктор.',
    category: 'school', season: 'winter', icon: 'pulse', metric: 'skill_carving', verification: 'instructor',
    tiers: [{ tier: 'gold', goal: 1 }],
  },
  {
    id: 's_edge', title: 'Смена канта', description: 'Связки поворотов на сноуборде. Навык подтверждает инструктор.',
    category: 'school', season: 'winter', icon: 'git-compare', metric: 'skill_edge', verification: 'instructor',
    tiers: [{ tier: 'silver', goal: 1 }],
  },
  {
    id: 's_freeride', title: 'Вне трасс', description: 'Курс фрирайда с инструктором и лавинным снаряжением.',
    category: 'school', season: 'winter', icon: 'shield-checkmark', metric: 'skill_freeride', verification: 'instructor',
    tiers: [{ tier: 'legend', goal: 1 }],
  },
  {
    id: 's_review', title: 'Честный отзыв', description: 'Отзывы после подтверждённых занятий.',
    category: 'school', season: 'all', icon: 'chatbox-ellipses', metric: 'reviews', unit: 'отзывов', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 5 }],
  },
  {
    id: 's_friend', title: 'Привёл друга', description: 'Друзья, которые пришли на занятие по вашей ссылке.',
    category: 'school', season: 'all', icon: 'people', metric: 'referrals', unit: 'друзей', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 3 }, { tier: 'gold', goal: 5, prize: 'Бесплатное занятие 1 час' }],
  },
  // ЛЕТО — маршруты (подтверждает гид)
  {
    id: 'r_baddu', title: 'Баддукские озёра', description: 'Пройти маршрут к Баддукским озёрам с гидом.',
    category: 'routes', season: 'summer', icon: 'water', metric: 'route_r1', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 3, cosmeticId: 'ti_baddu' }, { tier: 'gold', goal: 5 }],
  },
  {
    id: 'r_baddu_fast', title: 'Быстрее облаков', description: 'Дойти до Баддукских озёр быстрее чем за 3 часа.',
    category: 'routes', season: 'summer', icon: 'rocket', metric: 'baddukFast', verification: 'guide',
    partner: 'Партнёр (пример)', tiers: [{ tier: 'legend', goal: 1, cosmeticId: 'nc_aurora', prize: 'Скидка от партнёра программы' }],
  },
  {
    id: 'r_falls', title: 'Софийские водопады', description: 'Пройти маршрут к Софийским водопадам.',
    category: 'routes', season: 'summer', icon: 'rainy', metric: 'route_r2', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 3 }, { tier: 'gold', goal: 5 }],
  },
  {
    id: 'r_sofia', title: 'Софийские озёра', description: 'Пройти маршрут к Софийским озёрам.',
    category: 'routes', season: 'summer', icon: 'water', metric: 'route_r3', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'silver', goal: 1 }, { tier: 'gold', goal: 3 }, { tier: 'legend', goal: 5 }],
  },
  {
    id: 'r_lik', title: 'Лик Христа', description: 'Выход к скальному образу на хребте.',
    category: 'routes', season: 'summer', icon: 'eye', metric: 'route_r4', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 3 }],
  },
  {
    id: 'r_seven', title: 'Семицветное озеро', description: 'Пройти маршрут к Семицветному озеру.',
    category: 'routes', season: 'summer', icon: 'color-palette', metric: 'route_r5', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 3 }],
  },
  {
    id: 'r_glacier', title: 'Ледник', description: 'Двухдневный выход к Софийскому леднику.',
    category: 'routes', season: 'summer', icon: 'snow', metric: 'route_r6', unit: 'раз', verification: 'guide',
    tiers: [{ tier: 'gold', goal: 1, cosmeticId: 'ti_glacier' }, { tier: 'legend', goal: 2, cosmeticId: 'th_glacier' }],
  },
  {
    id: 'r_all', title: 'Все тропы Архыза', description: 'Пройти разные маршруты Архызпарка.',
    category: 'routes', season: 'summer', icon: 'map', metric: 'distinctRoutes', unit: 'маршрутов', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 2 }, { tier: 'silver', goal: 4, cosmeticId: 'ti_tracker' }, { tier: 'gold', goal: 6, cosmeticId: 'f_sun' }],
  },
  // ЛЕТО — километры и высота
  {
    id: 'h_km', title: 'Километры', description: 'Пройдено пешком в походах.',
    category: 'distance', season: 'summer', icon: 'footsteps', metric: 'hikeKm', unit: 'км', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 25 }, { tier: 'silver', goal: 100, cosmeticId: 'nc_pine' }, { tier: 'gold', goal: 250 }, { tier: 'legend', goal: 500 }],
  },
  {
    id: 'h_gain', title: 'Набор высоты', description: 'Суммарный набор высоты в походах.',
    category: 'distance', season: 'summer', icon: 'trending-up', metric: 'hikeGain', unit: 'м', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 2000 }, { tier: 'silver', goal: 5000, cosmeticId: 'th_valley' }, { tier: 'gold', goal: 10000 }, { tier: 'legend', goal: 25000 }],
  },
  {
    id: 'h_alt', title: 'Высотомер', description: 'Максимальная высота, на которой вы побывали.',
    category: 'distance', season: 'summer', icon: 'podium', metric: 'maxAlt', unit: 'м', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 2000 }, { tier: 'silver', goal: 2500 }, { tier: 'gold', goal: 2800 }, { tier: 'legend', goal: 3000 }],
  },
  {
    id: 'h_multiday', title: 'Ночь в горах', description: 'Многодневные походы с ночёвкой.',
    category: 'distance', season: 'summer', icon: 'moon', metric: 'multiday', unit: 'походов', verification: 'guide',
    tiers: [{ tier: 'silver', goal: 1 }, { tier: 'gold', goal: 3 }, { tier: 'legend', goal: 5 }],
  },
  {
    id: 'h_hikes', title: 'Походник', description: 'Выходы в горы с гидом.',
    category: 'series', season: 'summer', icon: 'walk', metric: 'hikes', unit: 'выходов', verification: 'guide',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 5, cosmeticId: 'f_pine' }, { tier: 'gold', goal: 10 }, { tier: 'legend', goal: 25 }],
  },
  {
    id: 'h_photos', title: 'Фотограф маршрута', description: 'Фото с геометками в дневнике.',
    category: 'distance', season: 'summer', icon: 'camera', metric: 'photos', unit: 'фото', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 10 }, { tier: 'silver', goal: 50 }, { tier: 'gold', goal: 150 }],
  },
  {
    id: 'h_ready', title: 'Собран по списку', description: 'Выйти на маршрут со 100% готовностью инвентаря.',
    category: 'series', season: 'summer', icon: 'bag-check', metric: 'readyHikes', unit: 'раз', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 5 }, { tier: 'gold', goal: 10 }],
  },
  // ОБЩИЕ
  {
    id: 'a_seasons', title: 'Ветеран Архыза', description: 'Сезоны с Архызпарком.',
    category: 'series', season: 'all', icon: 'ribbon', metric: 'seasons', unit: 'сезонов', verification: 'auto',
    tiers: [{ tier: 'silver', goal: 2 }, { tier: 'gold', goal: 3, cosmeticId: 'ti_veteran' }, { tier: 'legend', goal: 5, cosmeticId: 'nc_gold' }],
  },
  {
    id: 'a_year', title: 'Круглый год', description: 'Зимний и летний выход в одном году.',
    category: 'series', season: 'all', icon: 'sync', metric: 'bothSeasons', verification: 'auto',
    tiers: [{ tier: 'gold', goal: 1, cosmeticId: 'nc_sunset' }],
  },
  {
    id: 'a_published', title: 'Открытый дневник', description: 'Опубликованные записи дневника.',
    category: 'series', season: 'all', icon: 'book', metric: 'published', unit: 'записей', verification: 'auto',
    tiers: [{ tier: 'bronze', goal: 1 }, { tier: 'silver', goal: 10 }, { tier: 'gold', goal: 25 }],
  },
  // СЕКРЕТНЫЕ
  {
    id: 'x_first_lift', title: 'Первая гондола', description: 'Первый спуск дня раньше 9:15.',
    category: 'secret', season: 'winter', icon: 'sunny', metric: 'earlyBird', verification: 'auto', secret: true,
    tiers: [{ tier: 'silver', goal: 1 }, { tier: 'gold', goal: 5 }],
  },
  {
    id: 'x_opening', title: 'День открытия', description: 'Кататься в день открытия сезона.',
    category: 'secret', season: 'winter', icon: 'sparkles', metric: 'openingDay', verification: 'auto', secret: true,
    tiers: [{ tier: 'gold', goal: 1, cosmeticId: 'f_ice' }],
  },
  {
    id: 'x_dawn', title: 'Рассвет на тропе', description: 'Выйти на маршрут до 6:00.',
    category: 'secret', season: 'summer', icon: 'partly-sunny', metric: 'dawnStart', verification: 'auto', secret: true,
    tiers: [{ tier: 'gold', goal: 1, cosmeticId: 'th_dawn' }],
  },
  {
    id: 'x_last', title: 'Последний спуск', description: 'Спуск в последние 10 минут работы подъёмников.',
    category: 'secret', season: 'winter', icon: 'moon', metric: 'lastRun', verification: 'auto', secret: true,
    tiers: [{ tier: 'silver', goal: 1 }],
  },
  {
    id: 'x_rain', title: 'Непромокаемый', description: 'Пройти маршрут до конца в дождь.',
    category: 'secret', season: 'summer', icon: 'umbrella', metric: 'rainHike', verification: 'guide', secret: true,
    tiers: [{ tier: 'silver', goal: 1 }],
  },
];

// Детские достижения: только косметика, без призов и публичности
export const kidsAchievements: Achievement[] = [
  {
    id: 'k_first', title: 'Первый день в школе', description: 'Первое занятие в детской школе.',
    category: 'kids', season: 'winter', icon: 'star', metric: 'k_lessons', verification: 'instructor',
    tiers: [{ tier: 'bronze', goal: 1 }],
  },
  {
    id: 'k_lessons', title: 'Маленький горнолыжник', description: 'Занятия в детской школе.',
    category: 'kids', season: 'winter', icon: 'school', metric: 'k_lessons', unit: 'занятий', verification: 'instructor',
    tiers: [{ tier: 'bronze', goal: 3 }, { tier: 'silver', goal: 5 }, { tier: 'gold', goal: 10 }],
  },
  {
    id: 'k_snowflake', title: 'Снежинка', description: 'Первый самостоятельный спуск по зелёной трассе.',
    category: 'kids', season: 'winter', icon: 'snow', metric: 'k_green', verification: 'instructor',
    tiers: [{ tier: 'silver', goal: 1 }],
  },
  {
    id: 'k_lift', title: 'Смелый райдер', description: 'Первый подъём на бугельном подъёмнике.',
    category: 'kids', season: 'winter', icon: 'arrow-up-circle', metric: 'k_lift', verification: 'instructor',
    tiers: [{ tier: 'silver', goal: 1 }],
  },
  {
    id: 'k_plough', title: 'Плуг-мастер', description: 'Торможение плугом до полной остановки.',
    category: 'kids', season: 'winter', icon: 'hand-left', metric: 'k_plough', verification: 'instructor',
    tiers: [{ tier: 'gold', goal: 1 }],
  },
];

export const achievementById = (id: string) =>
  achievements.find((a) => a.id === id) ?? kidsAchievements.find((a) => a.id === id)!;
