import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { defaultCosmetics } from '@/data/achievements';
import {
  initialBookings, initialChats, initialChildren, initialGear, initialManualMetrics, initialSummer, initialWinter,
} from '@/data/mock';
import type { Achievement, AchievementTier, BookingRequest, Chat, Child, GearItem, Session } from '@/data/types';
import { computeMetrics, levelOf, newlyUnlocked, ownedCosmetics } from '@/logic/stats';
import type { Season } from '@/theme/theme';

export interface Equipped {
  frame: string;
  title: string;
  nameColor: string;
  theme: string;
  showcase: string[];
}

interface Store {
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
}

const Ctx = createContext<Store | null>(null);

const monthSeason = (): Season => {
  const m = new Date().getMonth();
  return m >= 10 || m <= 3 ? 'winter' : 'summer';
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<Season>(monthSeason());
  const [sessions, setSessions] = useState<Session[]>([...initialWinter, ...initialSummer]);
  const [manual, setManual] = useState(initialManualMetrics);
  const [equipped, setEquipped] = useState<Equipped>({
    frame: 'f_ice', title: 'ti_novice', nameColor: 'nc_white', theme: 'th_gondola',
    showcase: ['r_baddu', 'w_all_trails', 's_lessons'],
  });
  const [bookings, setBookings] = useState(initialBookings);
  const [chats, setChats] = useState(initialChats);
  const [gear, setGear] = useState(initialGear);
  const [instructorMode, setInstructorMode] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);

  const metrics = useMemo(() => computeMetrics(sessions, manual), [sessions, manual]);
  const level = useMemo(() => levelOf(metrics), [metrics]);
  const owned = useMemo(() => {
    const o = ownedCosmetics(metrics, defaultCosmetics);
    o.add('f_ice'); // выдана за «День открытия» в прошлом сезоне (демо)
    return o;
  }, [metrics]);

  const value: Store = {
    season, setSeason,
    userName: 'Влад',
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
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
