// Имитация сервера Архызпарка. Когда появится настоящий бэкенд, заменим только этот файл:
// экраны и очередь отправки останутся как есть.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookingRequest } from '@/data/types';
import { getFailureRate, isOnlineNow } from '@/logic/network';

const SERVER_KEY = 'arkhyzpark:mock-server';

export class NetworkError extends Error {
  constructor(msg = 'Нет соединения с сервером') {
    super(msg);
    this.name = 'NetworkError';
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function serverDb(): Promise<Record<string, { receivedAt: string }>> {
  const raw = await AsyncStorage.getItem(SERVER_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Идемпотентность: у каждой заявки свой ключ. Если запрос повторили (плохая сеть, двойное нажатие,
// повтор из очереди), сервер узнаёт ключ и НЕ создаёт вторую заявку, а возвращает первую.
export async function sendBooking(b: BookingRequest): Promise<{ duplicate: boolean }> {
  if (!isOnlineNow()) throw new NetworkError();
  await wait(700 + Math.random() * 600); // задержка сети
  if (!isOnlineNow()) throw new NetworkError('Соединение пропало во время отправки');
  if (Math.random() < getFailureRate()) throw new NetworkError('Сервер не ответил (таймаут)');
  const db = await serverDb();
  if (db[b.idempotencyKey]) return { duplicate: true };
  db[b.idempotencyKey] = { receivedAt: new Date().toISOString() };
  await AsyncStorage.setItem(SERVER_KEY, JSON.stringify(db));
  return { duplicate: false };
}

export async function serverBookingsCount() {
  return Object.keys(await serverDb()).length;
}

export async function clearServer() {
  await AsyncStorage.removeItem(SERVER_KEY);
}
