import assert from 'node:assert/strict';
import { newCard, review } from './srs.js';
const { db, save, exportJSON, importJSON, revive, addMine, addCustom, parseList } = await import('./store.js');

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
for (const [v, want] of [[-1, 5], [0, 5], [7, 5], [8, 8], [3, 3]]) assert.equal(revive({ settings: { newBatch: v } }).settings.newBatch, want, 'newBatch ' + v);
assert.deepEqual(revive(null).cards, {});
assert.equal(revive(null).settings.voiceTipShown, false);
assert.equal(revive({ settings: { voiceTipShown: true } }).settings.voiceTipShown, true);
assert.equal(revive({ settings: { voiceTipShown: 'yes' } }).settings.voiceTipShown, false);

const before = exportJSON();
assert.equal(importJSON('not json').ok, false);
assert.equal(importJSON('[1]').ok, false);
assert.equal(importJSON('{}').ok, false);
assert.equal(importJSON('{"foo":1}').ok, false);
assert.equal(exportJSON(), before, 'failed import leaves db unchanged');

const other = JSON.parse(before);
other.settings.deviceId = 'other-device'; other.settings.groupCode = 'OTHER'; other.settings.name = 'Imported';
delete other.cards['h-a'];
assert.equal(importJSON(JSON.stringify(other)).ok, true);
assert.equal(db.settings.deviceId, id0, 'deviceId survives import');
assert.equal(db.settings.groupCode, 'GRP', 'groupCode survives import');
assert.equal(db.settings.name, 'Imported');
assert.deepEqual(db.cards, {});

// M2: lists, custom words, milestones
const g1 = JSON.parse(JSON.stringify(good));
const m2 = revive({
  cards: { 'w-1311110': g1, 'g-wo': g1, 'g-wa-desu': g1, 'g-nope': g1, 'c-1': g1, 'c-2': g1, 'c-3': g1, 'w-abc': g1, 'g-WO': g1 },
  custom: { 'c-1': { r: 'ぷりん', w: 'プリン', m: ['pudding'] }, 'c-3': { r: 'abc', m: ['x'] }, 'c-4': { r: 'ぷ', m: [] }, 'x-1': { r: 'ぷ', m: ['a'] }, 'c-5': { r: 'ぷ', m: ['a', ''] } },
  mine: { words: ['w-1', 'w-1', 5, 'c-1', 'c-9'], grammar: ['g-wa-desu', 'g-wa-desu', 'g-nope', null] },
  seen: ['a', 'a', 3],
});
assert.deepEqual(Object.keys(m2.cards).sort(), ['c-1', 'g-wa-desu', 'g-wo', 'w-1311110']);
assert.deepEqual(Object.keys(m2.custom), ['c-1']);
assert.deepEqual(m2.mine, { words: ['w-1', 'c-1'], grammar: ['g-wa-desu'] });
assert.deepEqual(m2.seen, ['a']);
const m1 = revive({ cards: {}, settings: {} });
assert.deepEqual([m1.mine, m1.custom, m1.seen], [{ words: [], grammar: [] }, {}, []]);

assert.equal(addMine('words', 'w-1'), true);
assert.equal(addMine('words', 'w-1'), false);
db.cards['w-2'] = good;
assert.equal(addMine('words', 'w-2'), false);
const c = addCustom({ r: 'ぷりん', m: ['pudding'] });
assert.equal(c, 'c-1');
assert.equal(addCustom({ r: 'ぷりん', w: 'プリン', m: ['pudding'] }), 'c-2');
assert.ok(db.mine.words.includes('c-2'));

const W = [{ id: 'w-1', w: '学生', r: 'がくせい' }, { id: 'w-2', w: '先生', r: 'せんせい' }];
const pl = parseList('学生\n\n がくせい \nzzz\n学生\nzzz', W);
assert.deepEqual(pl.found, [W[0]]);
assert.deepEqual(pl.unknown, ['zzz']);
const proto = revive({ cards: { constructor: good, toString: good }, mine: { words: ['constructor', 'toString'], grammar: ['constructor'] } });
assert.deepEqual([proto.cards, proto.mine], [{}, { words: [], grammar: [] }]);
const nc = Object.keys(db.custom).length;
for (const bad of [{ r: 'abc', m: ['x'] }, { r: 'ぷ', m: [] }, { r: 'ぷ', m: ['x'.repeat(81)] }, { r: 'ぷ', m: [''] }, null]) assert.equal(addCustom(bad), null, 'rejects ' + JSON.stringify(bad));
assert.equal(addCustom({ r: 'ぷ', w: 'x'.repeat(21), m: ['a'] }), 'c-3');
assert.equal(db.custom['c-3'].w, '');
assert.equal(Object.keys(db.custom).length, nc + 1, 'invalid ones not saved');
const many = Array.from({ length: 600 }, (_, i) => ({ id: 'w-' + i, w: 'x' + i, r: 'y' + i }));
const big = parseList(many.map(w => w.w).join('\n'), many);
assert.equal(big.found.length, 500);
const cc = Object.keys(db.custom).length, again = parseList('ぷりん', []);
assert.deepEqual([again.found.map(x => x.id), again.unknown], [['c-1'], []], 'custom words match on paste');
assert.equal(Object.keys(db.custom).length, cc);
console.log('store ok');
