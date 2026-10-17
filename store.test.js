import assert from 'node:assert/strict';
import { newCard, review } from './srs.js';
const { db, save, exportJSON, importJSON, revive } = await import('./store.js');

const now = new Date('2026-10-17T10:00:00');
const id0 = db.settings.deviceId;
assert.match(id0, /^[0-9a-f-]{36}$/);
assert.equal(db.settings.newBatch, 5);

db.cards['h-a'] = review(newCard(now), 3, now);
db.days['2026-10-17'] = { reviews: 4, cleared: true };
db.race['2026-10-17'] = { time: 61.5 };
db.settings.name = 'Chris'; db.settings.groupCode = 'GRP';
save();

const back = revive(JSON.parse(exportJSON()));
assert.ok(back.cards['h-a'].due instanceof Date);
assert.equal(back.cards['h-a'].due.getTime(), db.cards['h-a'].due.getTime());
assert.equal(back.cards['h-a'].last_review.getTime(), now.getTime());
assert.deepEqual(back.days, db.days);
assert.deepEqual(back.race, db.race);

const good = JSON.parse(JSON.stringify(db.cards['h-a']));
const bad = revive({
  cards: { 'h-a': { ...good, due: 'garbage' }, zzz: good, 'h-i': { ...good, stability: 'x' }, 'h-u': { ...good, last_review: undefined }, 'h-e': { ...good, reps: Infinity } },
  days: { '2026-10-17': { reviews: 'x', cleared: true }, '2026-10-18': { reviews: -1, cleared: false }, '2026-10-19': { reviews: 2, cleared: 'yes' } },
  race: { '2026-10-17': { time: -3 }, '2026-10-18': { time: 'x' } },
  settings: { name: 5, newBatch: 'x', evil: 1 },
});
assert.deepEqual(Object.keys(bad.cards), ['h-u'], 'only valid known cards survive');
assert.deepEqual(bad.days, {});
assert.deepEqual(bad.race, {});
assert.equal(bad.settings.evil, undefined);
assert.equal(bad.settings.newBatch, 5);
assert.equal(bad.settings.name, '');
for (const [v, want] of [[-1, 0], [2.5, 2], [99, 54], [7, 7], ['x', 0]]) assert.equal(revive({ settings: { lastStation: v } }).settings.lastStation, want, 'lastStation ' + v);
assert.deepEqual(revive(null).cards, {});
assert.equal(revive(null).settings.voiceTipShown, false);
assert.equal(revive({ settings: { voiceTipShown: true } }).settings.voiceTipShown, true);
assert.equal(revive({ settings: { voiceTipShown: 'yes' } }).settings.voiceTipShown, false);

const before = exportJSON();
assert.equal(importJSON('not json').ok, false);
assert.equal(importJSON('[1]').ok, false);
assert.equal(exportJSON(), before, 'failed import leaves db unchanged');

const other = JSON.parse(before);
other.settings.deviceId = 'other-device'; other.settings.groupCode = 'OTHER'; other.settings.name = 'Imported';
delete other.cards['h-a'];
assert.equal(importJSON(JSON.stringify(other)).ok, true);
assert.equal(db.settings.deviceId, id0, 'deviceId survives import');
assert.equal(db.settings.groupCode, 'GRP', 'groupCode survives import');
assert.equal(db.settings.name, 'Imported');
assert.deepEqual(db.cards, {});
console.log('store ok');
