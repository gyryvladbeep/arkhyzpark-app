// Генератор синтетических GPX для эмулятора (запускается один раз, в проект не входит)
import fs from 'fs';
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const noise = (m) => (rnd() - 0.5) * 2 * m;
const base = { lat: 43.5470, lon: 41.2020 }; // район горнолыжного склона Архыза (условно)
const mPerLat = 111320, mPerLon = 111320 * Math.cos(base.lat * Math.PI / 180);
function ski() {
  const pts = []; let t = Date.UTC(2026, 0, 10, 6, 0, 0);
  const push = (x, y, alt, dt) => { t += dt * 1000; pts.push({ lat: base.lat + y / mPerLat + noise(2) / mPerLat, lon: base.lon + x / mPerLon + noise(2) / mPerLon, alt: alt + noise(3), t }); };
  for (let r = 0; r < 3; r++) {
    // подъём на гондоле: 900 м вверх, 2400 м по горизонтали, ~5 м/с
    for (let i = 0; i <= 120; i++) push(i * 20, i * 5, 1700 + i * 7.5, 5);
    // пауза наверху
    for (let i = 0; i < 6; i++) push(2400, 600, 2600, 10);
    // спуск: серпантин вниз, 12–17 м/с
    for (let i = 0; i <= 150; i++) { const f = i / 150; push(2400 - f * 2400 + Math.sin(f * 20) * 80, 600 - f * 600, 2600 - f * 900, 2); }
    for (let i = 0; i < 6; i++) push(0, 0, 1700, 10);
  }
  return pts;
}
function hike() {
  const pts = []; let t = Date.UTC(2026, 6, 18, 4, 0, 0);
  const push = (x, y, alt, dt) => { t += dt * 1000; pts.push({ lat: base.lat + y / mPerLat + noise(3) / mPerLat, lon: base.lon + x / mPerLon + noise(3) / mPerLon, alt: alt + noise(3), t }); };
  // 8 км вверх на 750 м, привал 20 минут, обратно
  for (let i = 0; i <= 400; i++) push(i * 12, i * 15, 1650 + i * 1.875, 12);
  for (let i = 0; i < 40; i++) push(4800, 6000, 2400, 30);
  for (let i = 400; i >= 0; i--) push(i * 12, i * 15, 1650 + i * 1.875, 9);
  return pts;
}
const gpx = (name, pts) => `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="arkhyzpark-test">\n<trk><name>${name}</name><trkseg>\n` +
  pts.map(p => `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"><ele>${p.alt.toFixed(1)}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('\n') + '\n</trkseg></trk>\n</gpx>\n';
const s = ski(), h = hike();
fs.writeFileSync('test-data/arkhyz-ski-3-runs.gpx', gpx('Архыз: 3 спуска (синтетика)', s));
fs.writeFileSync('test-data/arkhyz-hike-16km.gpx', gpx('Архыз: поход 16 км (синтетика)', h));

