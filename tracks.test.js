import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRACKS, trackOf, wordOrder } from './tracks.js';
import { TRAVEL, TRAVEL_IDS, GLOSS } from './travel.js';
import { ready, item, loadedWords, loadedKanji, ladderFor } from './items.js';
import { nextNew, kanjiReady } from './session.js';
import { BASIC, LEARN } from './rules.js';
import { PHRASES } from './phrases.js';
import { stage, budget } from './pace.js';
import { db, revive } from './store.js';

await ready(async p => ({ ok: true, json: async () => JSON.parse(readFileSync(p, 'utf8')) }));
const words = loadedWords(), kanji = loadedKanji(), all = ids => Object.fromEntries(ids.map(id => [id, {}]));

// The travel list: every id is a real word, no repeats, themes woven together, travel glosses applied.
assert.equal(new Set(TRAVEL_IDS).size, TRAVEL_IDS.length);
assert.ok(TRAVEL_IDS.every(id => item(id)?.kind === 'word'), 'every travel id is in words.json');
assert.deepEqual(TRAVEL_IDS.slice(0, Object.keys(TRAVEL).length), Object.values(TRAVEL).map(l => l[0]), 'one of each theme first');
for (const [id, g] of Object.entries(GLOSS)) assert.equal(item(id).m[0], g);
assert.equal(trackOf('').name, 'Whole language');
assert.equal(trackOf('nope'), TRACKS.whole);

// Travel: its words first, two phrases a batch, no kanji, no automatic grammar.
const travel = TRACKS.travel, order = wordOrder(words, travel);
assert.deepEqual(order.slice(0, 3).map(w => w.id), TRAVEL_IDS.slice(0, 3));
assert.equal(order.length, words.length);
assert.equal(wordOrder(words, TRACKS.whole), words);
assert.equal(nextNew({}, 5, { words: order, kanji, track: travel }).filter(id => id.startsWith('p-')).length, 1, 'one phrase a batch while kana remain');
assert.equal(nextNew(all(LEARN), 5, { words: order, kanji, track: travel }).filter(id => id.startsWith('p-')).length, 2, 'then two');
const kana = all([...LEARN, ...PHRASES.map(p => p.id)]);
const many = { ...kana, ...all(words.slice(0, 120).map(w => w.id)) };
assert.deepEqual(kanjiReady(many, kanji, 'none'), []);
const t = nextNew(many, 5, { words: order, kanji, track: travel });
assert.ok(!t.some(id => /^k-\p{Script=Han}|^g-/u.test(id)), 'no kanji or grammar on Travel');
assert.ok(t.filter(id => id.startsWith('w-')).every(id => TRAVEL_IDS.includes(id)), 'travel words come first');
assert.ok(t.includes('n-digits'), 'and the numbers lessons (prices, times) start');
assert.ok(nextNew(many, 5, { words: order, kanji, track: travel, mine: { grammar: ['g-ka'] } }).includes('g-ka'), 'a pulled grammar point still comes');

// Conversation: N5 kanji only, one a batch; Whole: a quarter.
const talk = TRACKS.talk;
assert.ok(kanjiReady(many, kanji, 'light').every(id => item(id).j === 5));
assert.ok(kanjiReady(many, kanji, 'light').length < kanjiReady(many, kanji, 'full').length);
assert.equal(nextNew(many, 10, { words, kanji, track: talk }).filter(id => /^k-\p{Script=Han}/u.test(id)).length, 1);
assert.equal(nextNew(many, 10, { words, kanji, track: TRACKS.whole }).filter(id => /^k-\p{Script=Han}/u.test(id)).length, 2);

// Ladders: tracing only on Whole language; Conversation reaches speaking at half the stability.
const k = item('k-日'), w = item(order[0].id);
db.settings.track = 'whole'; assert.ok(ladderFor(k).some(([r]) => r === 'trace'));
db.settings.track = 'talk'; assert.ok(!ladderFor(k).some(([r]) => r === 'trace'));
assert.equal(ladderFor(w).find(([r]) => r === 'say')[1], 6);
db.settings.track = 'travel'; assert.ok(!ladderFor(k).some(([r]) => r === 'trace'));
assert.equal(ladderFor(w).find(([r]) => r === 'say')[1], 12);
db.settings.track = '';

// Pace: Travel has a travel-set stage between kana and N5.
assert.equal(stage(kana, words, true).id, 'travel');
assert.equal(stage(kana, words, false).id, 'n5');
assert.equal(stage({ ...kana, ...all(TRAVEL_IDS) }, words, true).id, 'n5');
assert.equal(budget(kana, words, {}, new Date(), '2026-11-10', 0, true), 7);

// The choice survives a backup; an unknown one means "not chosen yet".
assert.equal(revive({ settings: { track: 'talk' } }).settings.track, 'talk');
assert.equal(revive({ settings: { track: 'x' } }).settings.track, '');
console.log('tracks ok');
