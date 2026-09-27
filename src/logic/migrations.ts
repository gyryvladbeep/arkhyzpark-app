// Миграции данных между версиями приложения. Чистые функции без импортов из React Native,
// поэтому их можно проверить unit-тестом: test-data/migrations.test.mts

// Версия схемы данных. Меняем структуру хранения — поднимаем версию и пишем миграцию,
// чтобы у пользователя, обновившего приложение, не пропали записи.
export const SCHEMA_VERSION = 3;

export interface Persisted {
  version: number;
  savedAt: string;
  data: Record<string, unknown>;
}

// Миграции идут по цепочке: v1 -> v2 -> v3. Пользователь мог пропустить несколько обновлений.
// v1 -> v2: в записях появилось поле track (точки GPS). Старым записям ставим пустой трек.
export function migrate(raw: Persisted): Persisted {
  let p = raw;
  if (p.version < 2) {
    const sessions = (p.data.sessions as Record<string, unknown>[] | undefined) ?? [];
    p = { ...p, version: 2, data: { ...p.data, sessions: sessions.map((s) => ({ track: undefined, source: 'demo', ...s })) } };
  }
  // v2 -> v3: у заявок появился ключ идемпотентности, в профиле — отметка о пройденном онбординге.
  // Кто уже пользовался приложением, тому онбординг повторно не показываем.
  if (p.version < 3) {
    const bookings = (p.data.bookings as Record<string, unknown>[] | undefined) ?? [];
    p = {
      ...p, version: 3,
      data: {
        ...p.data,
        onboarded: true,
        bookings: bookings.map((b, i) => ({ idempotencyKey: `legacy-${i}-${String(b.id)}`, ...b })),
      },
    };
  }
  return p;
}

