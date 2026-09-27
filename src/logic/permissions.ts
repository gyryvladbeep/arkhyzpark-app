// Разрешения на геолокацию. Отдельный модуль, чтобы вся логика статусов была в одном месте.
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export type PermState =
  | 'unknown' // ещё не спрашивали
  | 'granted'
  | 'denied' // отказал, но можно спросить снова
  | 'blocked'; // отказал навсегда: спросить можно только через системные настройки

export interface LocationStatus {
  servicesEnabled: boolean; // включена ли геолокация в телефоне вообще
  foreground: PermState; // «при использовании приложения»
  background: PermState; // «всегда»
  precise: boolean; // точная геопозиция (iOS 14+ и Android 12+ позволяют дать только приблизительную)
}

function toState(r: { granted: boolean; canAskAgain: boolean; status: string }): PermState {
  if (r.granted) return 'granted';
  if (r.status === 'undetermined') return 'unknown';
  return r.canAskAgain ? 'denied' : 'blocked';
}

export async function getLocationStatus(): Promise<LocationStatus> {
  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
  const fg = await Location.getForegroundPermissionsAsync();
  let background: PermState = 'unknown';
  if (Platform.OS !== 'web') {
    try {
      background = toState(await Location.getBackgroundPermissionsAsync());
    } catch {
      background = 'unknown';
    }
  }
  const precise = Platform.OS === 'ios'
    ? fg.ios?.accuracy !== 'reduced'
    : Platform.OS === 'android'
      ? fg.android?.accuracy !== 'coarse'
      : true;
  return { servicesEnabled, foreground: toState(fg), background, precise };
}

export async function requestForeground() {
  await Location.requestForegroundPermissionsAsync();
  return getLocationStatus();
}

// Фоновое разрешение спрашиваем ТОЛЬКО после того, как дали «при использовании».
// iOS покажет свой диалог, Android 11+ отправит пользователя в системные настройки.
export async function requestBackground() {
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    // в Expo Go фоновое разрешение недоступно — это нормально
  }
  return getLocationStatus();
}

export function openSettings() {
  Linking.openSettings().catch(() => {});
}
