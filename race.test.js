import assert from 'node:assert/strict';
import { raceItems, raceTime } from './race.js';
import { board, allowedOverride } from './group.js';

const a = raceItems('2026-10-17');
assert.deepEqual(a, raceItems('2026-10-17'));
assert.notDeepEqual(a, raceItems('2026-10-18'));
assert.equal(a.length, 20);
assert.equal(new Set(a.map(k => k.id)).size, 20);
assert.equal(raceTime(30000, 2), 36000);
assert.equal(await board(async () => { throw new Error('no network'); }), 'offline');
assert.equal(await board(async () => ({ ok: false })), 'offline');
const rows = await board(async () => ({ ok: true, json: async () => [{ name: '<img src=x onerror=1>', streak: '<b>', week: 5, race: { day: '2026-10-17', time: 'x' } }, 'junk', null] }));
assert.deepEqual(rows, [{ name: '<img src=x onerror=1>', streak: 0, week: 5, mastered: 0, station: 0, race: null }]);
assert.equal(allowedOverride('localhost', 'http://localhost:8787'), true);
assert.equal(allowedOverride('evil.com', 'http://localhost:8787'), false);
assert.equal(allowedOverride('localhost', 'http://evil.com'), false);
console.log('race ok');
