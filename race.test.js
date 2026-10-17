import assert from 'node:assert/strict';
import { raceItems, raceTime } from './race.js';
import { board } from './group.js';

const a = raceItems('2026-10-17');
assert.deepEqual(a, raceItems('2026-10-17'));
assert.notDeepEqual(a, raceItems('2026-10-18'));
assert.equal(a.length, 20);
assert.equal(new Set(a.map(k => k.id)).size, 20);
assert.equal(raceTime(30000, 2), 36000);
assert.equal(await board(async () => { throw new Error('no network'); }), 'offline');
assert.equal(await board(async () => ({ ok: false })), 'offline');
console.log('race ok');
