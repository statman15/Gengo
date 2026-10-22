import assert from 'node:assert/strict';
import { STATIONS, stationCost, journey } from './journey.js';

assert.equal(STATIONS.length, 55);
assert.ok(STATIONS.every(s => s.name && s.jp && s.focus));
assert.ok(STATIONS.every(s => typeof s.scene === 'string' && s.scene.length > 0));
assert.equal(STATIONS[0].name, 'Nihonbashi');
assert.equal(STATIONS[54].jp, '京都');
assert.deepEqual(journey(0), { station: 0, progress: 0 });
assert.equal(journey(10).station, 1);
assert.equal(journey(140).station, 14);
assert.equal(journey(178).station, 14);
assert.equal(journey(179).station, 15);
assert.equal(stationCost(54), 1700, 'Kyoto: an average learner at month 12');
assert.equal(stationCost(14), 140);
assert.equal(journey(5).progress, 0.5);
const end = journey(1e6);
assert.equal(end.station, 54);
assert.equal(end.progress, 1);
console.log('journey ok');
{ // the per-path station plan (scripts/journey-plan.mjs): every path, every station, in order
  const { readFileSync } = await import('node:fs');
  const { READINGS } = await import('./journey.js');
  const plan = JSON.parse(readFileSync('data/journey-plan.json', 'utf8'));
  assert.deepEqual(Object.keys(plan).sort(), ['talk', 'travel', 'whole']);
  assert.equal(READINGS.length, STATIONS.length);
  for (const [t, p] of Object.entries(plan)) {
    assert.equal(p.length, STATIONS.length, t);
    p.forEach((s, i) => i && s.day != null && assert.ok(s.day >= p[i - 1].day, `${t} ${i}: days in order`));
    assert.ok(p[0].learn.some(l => l.startsWith('Hiragana')), `${t}: kana on the first stretch`);
  }
  assert.ok(!plan.travel.some(s => s.learn.some(l => /kanji|^Grammar/.test(l))), 'Travel plans no kanji or grammar');
  assert.ok(plan.whole.some(s => s.learn.some(l => /kanji/.test(l))), 'Whole language plans kanji');
}
console.log('journey plan ok');
