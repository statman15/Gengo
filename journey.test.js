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
assert.equal(journey(165).station, 15);
assert.equal(stationCost(14), 140);
assert.equal(journey(5).progress, 0.5);
const end = journey(1e6);
assert.equal(end.station, 54);
assert.equal(end.progress, 1);
console.log('journey ok');
