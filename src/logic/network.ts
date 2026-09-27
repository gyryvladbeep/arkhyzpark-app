// Состояние сети. Реальный статус берём из expo-network, а для тестирования
// можно включить «имитацию офлайна» на экране «Для тестировщика» — не нужно включать режим полёта.
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

let simulateOffline = false;
let failureRate = 0; // доля запросов, которые «сервер» уронит случайно (0..1)
const listeners = new Set<() => void>();

export function setSimulateOffline(v: boolean) {
  simulateOffline = v;
  listeners.forEach((fn) => fn());
}
export const getSimulateOffline = () => simulateOffline;

export function setFailureRate(v: number) {
  failureRate = v;
  listeners.forEach((fn) => fn());
}
export const getFailureRate = () => failureRate;

let lastReal = true;

export function isOnlineNow() {
  return !simulateOffline && lastReal;
}

export function useOnline() {
  const state = Network.useNetworkState();
  const [, force] = useState(0);
  // isInternetReachable бывает undefined, пока система проверяет — это не «нет сети»
  const real = state.isConnected !== false && state.isInternetReachable !== false;
  lastReal = real;
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { online: real && !simulateOffline, real, simulated: simulateOffline, type: state.type };
}
