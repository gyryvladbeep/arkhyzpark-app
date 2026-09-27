// Сохранение состояния на телефоне между запусками.
// AsyncStorage — простое хранилище «ключ — строка» (на iOS файл, на Android SQLite, в браузере localStorage).
// Для токенов и паролей оно НЕ подходит: их хранят в Keychain / Keystore (expo-secure-store).
import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrate, SCHEMA_VERSION, type Persisted } from '@/logic/migrations';

export { SCHEMA_VERSION };

const KEY = 'arkhyzpark:state';

export async function loadState(): Promise<Record<string, unknown> | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return null;
    const parsed = JSON.parse(json) as Persisted;
    if (typeof parsed.version !== 'number' || parsed.version > SCHEMA_VERSION) return null; // данные из более новой версии не трогаем
    return migrate(parsed).data;
  } catch {
    return null; // битые данные не должны ронять приложение: стартуем с демо-данных
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

// Сохраняем не на каждое изменение, а с задержкой 400 мс: меньше записи на диск
export function saveStateDebounced(data: Record<string, unknown>) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const payload: Persisted = { version: SCHEMA_VERSION, savedAt: new Date().toISOString(), data };
    AsyncStorage.setItem(KEY, JSON.stringify(payload)).catch(() => {});
  }, 400);
}

export async function clearState() {
  await AsyncStorage.removeItem(KEY);
}

export async function storageInfo() {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return { bytes: 0, savedAt: null as string | null, version: SCHEMA_VERSION };
    const p = JSON.parse(json) as Persisted;
    return { bytes: json.length, savedAt: p.savedAt, version: p.version };
  } catch {
    return { bytes: 0, savedAt: null, version: SCHEMA_VERSION };
  }
}
