// Тест миграций хранилища. Запуск: node --no-warnings test-data/migrations.test.mts
// Сценарий из жизни: пользователь пропустил несколько обновлений и сразу поставил свежую версию.
import assert from 'node:assert/strict';
import { migrate, SCHEMA_VERSION } from '../src/logic/migrations.ts';

let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log('OK  ', name); }

const v1 = {
  version: 1,
  savedAt: '2026-01-01T00:00:00Z',
  data: {
    sessions: [{ id: 'w1', season: 'winter', runs: [] }],
    bookings: [{ id: 'b1', status: 'Отправлена' }, { id: 'b2', status: 'Проведена' }],
  },
};

test('данные v1 доезжают до последней версии за один запуск', () => {
  assert.equal(migrate(v1).version, SCHEMA_VERSION);
});

test('записи дневника не теряются', () => {
  const out = migrate(v1).data.sessions as { id: string; source: string }[];
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'w1');
  assert.equal(out[0].source, 'demo');
});

test('у старых заявок появился уникальный ключ идемпотентности', () => {
  const out = migrate(v1).data.bookings as { idempotencyKey: string }[];
  assert.equal(out.length, 2);
  assert.ok(out.every((b) => typeof b.idempotencyKey === 'string' && b.idempotencyKey.length > 0));
  assert.notEqual(out[0].idempotencyKey, out[1].idempotencyKey);
});

test('старому пользователю онбординг повторно не показывается', () => {
  assert.equal(migrate(v1).data.onboarded, true);
});

test('миграция не трогает уже свежие данные', () => {
  const fresh = { version: SCHEMA_VERSION, savedAt: 'x', data: { onboarded: false } };
  assert.deepEqual(migrate(fresh), fresh);
});

test('существующий ключ заявки не перезаписывается', () => {
  const v2 = { version: 2, savedAt: 'x', data: { bookings: [{ id: 'b9', idempotencyKey: 'keep-me' }] } };
  const out = migrate(v2).data.bookings as { idempotencyKey: string }[];
  assert.equal(out[0].idempotencyKey, 'keep-me');
});

console.log(`\nВсего пройдено: ${passed}`);
