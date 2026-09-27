import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { defaultCosmetics } from '@/data/achievements';
import {
  initialBookings, initialChats, initialChildren, initialGear, initialManualMetrics, initialSummer, initialWinter,
} from '@/data/mock';
import type { Achievement, AchievementTier, BookingRequest, Chat, Child, GearItem, Session } from '@/data/types';
import { NetworkError, sendBooking } from '@/logic/api';
import { useOnline } from '@/logic/network';
import { clearState, loadState, saveStateDebounced } from '@/logic/persist';
import { computeMetrics, levelOf, newlyUnlocked, ownedCosmetics } from '@/logic/stats';
import type { Season } from '@/theme/theme';

export interface Equipped {
  frame: string;
  title: string;
  nameColor: string;
  theme: string;
  showcase: string[];
}

export type Sport = 'ski' | 'snowboard' | 'hiking';

interface Store {
  hydrated: boolean;
  onboarded: boolean;
  completeOnboarding: (name: string, sports: Sport[]) => void;
  restartOnboarding: () => void;
  sports: Sport[];
  setUserName: (n: string) => void;
  retryBooking: (id: string) => void;
  season: Season;
  setSeason: (s: Season) => void;
  userName: string;
  sessions: Session[];
  metrics: Record<string, number>;
  level: ReturnType<typeof levelOf>;
  owned: Set<string>;
  equipped: Equipped;
  equip: (patch: Partial<Equipped>) => void;
  addSession: (s: Session, manualPatch?: Record<string, number>) => { a: Achievement; t: AchievementTier }[];
  togglePublish: (id: string) => void;
  deleteSession: (id: string) => void;
  confirmGuide: (id: string) => { a: Achievement; t: AchievementTier }[];
  bookings: BookingRequest[];
  addBooking: (b: BookingRequest) => void;
  chats: Chat[];
  sendMessage: (chatId: string, text: string) => void;
  gear: GearItem[];
  updateGear: (id: string, patch: Partial<GearItem>) => void;
  addGear: (item: GearItem) => void;
  children: Child[];
  instructorMode: boolean;
  setInstructorMode: (v: boolean) => void;
  confirmed: string[];
  confirm: (id: string) => void;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const monthSeason = (): Season => {
  const m = new Date().getMonth();
  return m >= 10 || m <= 3 ? 'winter' : 'summer';
};

const defaultEquipped: Equipped = {
  frame: 'f_ice', title: 'ti_novice', nameColor: 'nc_white', theme: 'th_gondola',
  showcase: ['r_baddu', 'w_all_trails', 's_lessons'],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [userName, setUserName] = useState('Влад');
  const [sports, setSports] = useState<Sport[]>(['ski']);
  const [season, setSeason] = useState<Season>(monthSeason());
  const [sessions, setSessions] = useState<Session[]>([...initialWinter, ...initialSummer]);
  const [manual, setManual] = useState(initialManualMetrics);
  const [equipped, setEquipped] = useState<Equipped>(defaultEquipped);
  const [bookings, setBookings] = useState(initialBookings);
  const [chats, setChats] = useState(initialChats);
  const [gear, setGear] = useState(initialGear);
  const [instructorMode, setInstructorMode] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);

  // Загрузка сохранённого состояния при запуске
  useEffect(() => {
    loadState().then((d) => {
      if (d) {
        if (d.sessions) setSessions(d.sessions as Session[]);
        if (d.manual) setManual(d.manual as typeof initialManualMetrics);
        if (d.equipped) setEquipped(d.equipped as Equipped);
        if (d.bookings) setBookings(d.bookings as BookingRequest[]);
        if (d.chats) setChats(d.chats as Chat[]);
        if (d.gear) setGear(d.gear as GearItem[]);
        if (d.confirmed) setConfirmed(d.confirmed as string[]);
        if (typeof d.onboarded === 'boolean') setOnboarded(d.onboarded);
        if (typeof d.userName === 'string') setUserName(d.userName);
        if (Array.isArray(d.sports)) setSports(d.sports as Sport[]);
      }
      setHydrated(true);
    });
  }, []);

  // Сохранение после каждого изменения (только когда загрузка уже прошла, иначе затрём данные демо-набором)
  useEffect(() => {
    if (!hydrated) return;
    saveStateDebounced({ sessions, manual, equipped, bookings, chats, gear, confirmed, onboarded, userName, sports });
  }, [hydrated, sessions, manual, equipped, bookings, chats, gear, confirmed, onboarded, userName, sports]);

  // ОЧЕРЕДЬ ОТПРАВКИ (outbox). Заявка сначала сохраняется на телефоне со статусом «В очереди»,
  // потом уходит на сервер. Нет сети — ждём. Ошибка — повторяем с растущей паузой: 5, 10, 20, 40, 60 с.
  const { online } = useOnline();
  const inFlight = useRef(new Set<string>());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 3000);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') setTick((x) => x + 1); });
    return () => { clearInterval(id); sub.remove(); };
  }, []);
  useEffect(() => {
    if (!hydrated || !online) return;
    const due = bookings.filter((b) => b.status === 'В очереди' && !inFlight.current.has(b.id) && (b.nextTryAt ?? 0) <= Date.now());
    for (const b of due) {
      inFlight.current.add(b.id);
      sendBooking(b)
        .then(() => {
          setBookings((arr) => arr.map((x) => (x.id === b.id ? { ...x, status: 'Отправлена', lastError: undefined, nextTryAt: undefined } : x)));
        })
        .catch((e: unknown) => {
          const attempts = (b.attempts ?? 0) + 1;
          const delay = Math.min(60000, 5000 * 2 ** (attempts - 1));
          const msg = e instanceof NetworkError ? e.message : 'Неизвестная ошибка';
          setBookings((arr) => arr.map((x) => (x.id === b.id ? { ...x, attempts, nextTryAt: Date.now() + delay, lastError: msg } : x)));
        })
        .finally(() => inFlight.current.delete(b.id));
    }
  }, [hydrated, online, bookings, tick]);

  const metrics = useMemo(() => computeMetrics(sessions, manual), [sessions, manual]);
  const level = useMemo(() => levelOf(metrics), [metrics]);
  const owned = useMemo(() => {
    const o = ownedCosmetics(metrics, defaultCosmetics);
    o.add('f_ice'); // выдана за «День открытия» в прошлом сезоне (демо)
    return o;
  }, [metrics]);

  const value: Store = {
    hydrated,
    onboarded,
    completeOnboarding: (name, sp) => {
      if (name.trim()) setUserName(name.trim());
      setSports(sp.length ? sp : ['ski']);
      if (sp.length && !sp.includes('ski') && !sp.includes('snowboard')) setSeason('summer');
      setOnboarded(true);
    },
    restartOnboarding: () => setOnboarded(false),
    sports,
    setUserName,
    retryBooking: (id) => setBookings((arr) => arr.map((x) => (x.id === id ? { ...x, nextTryAt: 0 } : x))),
    season, setSeason,
    userName,
    sessions, metrics, level, owned, equipped,
    equip: (patch) => setEquipped((e) => ({ ...e, ...patch })),
    addSession: (s, manualPatch) => {
      const nextManual = { ...manual };
      if (manualPatch) for (const k of Object.keys(manualPatch)) nextManual[k] = (nextManual[k] ?? 0) + manualPatch[k];
      const after = computeMetrics([s, ...sessions], nextManual);
      const unlocked = newlyUnlocked(metrics, after);
      setSessions((arr) => [s, ...arr.map((x) => ({ ...x, isNew: false }))]);
      setManual(nextManual);
      return unlocked;
    },
    togglePublish: (id) => setSessions((arr) => arr.map((x) => (x.id === id ? { ...x, published: !x.published } : x))),
    deleteSession: (id) => setSessions((arr) => arr.filter((x) => x.id !== id)),
    confirmGuide: (id) => {
      const next = sessions.map((x) => (x.id === id && x.season === 'summer' ? { ...x, confirmedByGuide: true } : x));
      const unlocked = newlyUnlocked(metrics, computeMetrics(next, manual));
      setSessions(next);
      return unlocked;
    },
    bookings,
    addBooking: (b) => setBookings((arr) => [b, ...arr]),
    chats,
    sendMessage: (chatId, text) =>
      setChats((arr) =>
        arr.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, { id: String(Date.now()), from: 'me', text, time: 'сейчас' }] }
            : c,
        ),
      ),
    gear,
    updateGear: (id, patch) => setGear((arr) => arr.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    addGear: (item) => setGear((arr) => [...arr, item]),
    children: initialChildren,
    instructorMode, setInstructorMode,
    confirmed,
    confirm: (id) => setConfirmed((arr) => [...arr, id]),
    resetAll: async () => {
      await clearState();
      setSessions([...initialWinter, ...initialSummer]);
      setManual(initialManualMetrics);
      setEquipped(defaultEquipped);
      setBookings(initialBookings);
      setChats(initialChats);
      setGear(initialGear);
      setConfirmed([]);
      setOnboarded(false);
      setUserName('Влад');
      setSports(['ski']);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
