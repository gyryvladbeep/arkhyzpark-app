// Мини unit-тесты обработки трека. Запуск: node test-data/geo-math.test.mts
// Читают синтетические GPX из этой папки и проверяют, что статистика считается правильно.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { detectRuns, distanceM, filterPoints, gainLoss, movingRest, smoothAltitudes, totalDistanceM, trimEnds, type TrackPoint } from '../src/logic/geo-math.ts';

function readGpx(file: string): TrackPoint[] {
  const xml = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const re = /<trkpt lat="([\d.]+)" lon="([\d.]+)"><ele>([\d.]+)<\/ele><time>([^<]+)<\/time>/g;
  const pts: TrackPoint[] = [];
  for (const m of xml.matchAll(re)) {
    pts.push({ lat: +m[1], lon: +m[2], alt: +m[3], acc: 8, speed: null, t: Date.parse(m[4]) });
  }
  return pts;
}

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('OK  ', name);
}

const ski = filterPoints(readGpx('./arkhyz-ski-3-runs.gpx'));
const hike = filterPoints(readGpx('./arkhyz-hike-16km.gpx'));

test('на лыжном треке найдено ровно 3 спуска', () => {
  assert.equal(detectRuns(ski).length, 3);
});

test('перепад каждого спуска около 900 м (±30 м)', () => {
  for (const r of detectRuns(ski)) assert.ok(Math.abs(r.dropM - 900) <= 30, `перепад ${r.dropM}`);
});

test('максимальная скорость спуска правдоподобна (40–70 км/ч)', () => {
  for (const r of detectRuns(ski)) assert.ok(r.maxSpeedKmh >= 40 && r.maxSpeedKmh <= 70, `скорость ${r.maxSpeedKmh}`);
});

test('подъём на гондоле не считается спуском', () => {
  for (const r of detectRuns(ski)) assert.ok(r.dropM > 0);
});

test('поход: дистанция 15–17 км', () => {
  const km = totalDistanceM(hike) / 1000;
  assert.ok(km > 15 && km < 17, `км ${km}`);
});

test('поход: набор высоты около 750 м, шум не накручивает лишнее', () => {
  const { gain } = gainLoss(smoothAltitudes(hike));
  assert.ok(Math.abs(gain - 750) <= 40, `набор ${gain}`);
});

test('поход: привал около 20 минут распознан как остановка', () => {
  const { restSec } = movingRest(hike);
  assert.ok(restSec >= 15 * 60 && restSec <= 25 * 60, `отдых ${restSec} с`);
});

test('точка с плохой точностью (100 м) отбрасывается', () => {
  const bad = [...ski.slice(0, 5), { ...ski[5], acc: 100 }, ...ski.slice(6, 10)];
  assert.equal(filterPoints(bad).length, 9);
});

test('скачок GPS на 2 км за полсекунды отбрасывается', () => {
  const p = ski[50];
  const spike = { ...p, lat: p.lat + 0.02, t: p.t + 500 };
  const pts = [...ski.slice(0, 51), spike, ...ski.slice(51, 60)];
  assert.equal(filterPoints(pts).length, 60);
});

test('граница скорости: 150 км/ч проходит, 160 км/ч отбрасывается', () => {
  const a: TrackPoint = { lat: 43.5, lon: 41.2, alt: 2000, acc: 5, speed: null, t: 0 };
  const metersPerDegLat = 111195;
  const at = (kmh: number): TrackPoint => ({ ...a, lat: a.lat + (kmh / 3.6) / metersPerDegLat, t: 1000 });
  assert.equal(filterPoints([a, at(149)]).length, 2);
  assert.equal(filterPoints([a, at(160)]).length, 1);
});

test('приватность: первые и последние 200 м трека скрыты', () => {
  const trimmed = trimEnds(hike, 200);
  assert.ok(distanceM(hike[0], trimmed[0]) >= 190, 'начало не обрезано');
  assert.ok(distanceM(hike[hike.length - 1], trimmed[trimmed.length - 1]) >= 190, 'конец не обрезан');
});

test('приватность: трек короче 400 м целиком скрыт', () => {
  assert.equal(trimEnds(hike.slice(0, 10), 200).length, 0);
});

console.log(`\nВсего пройдено: ${passed}`);
