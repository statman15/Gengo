import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ready, item, loadedKanji, ladderFor } from './items.js';
import { kanjiReady, nextNew } from './session.js';
import { kanjiReading } from './activities.js';
import { revive } from './store.js';

const file = p => ({ ok: true, json: async () => JSON.parse(readFileSync(p, 'utf8')) });
await ready(async p => file(p));
const K = loadedKanji();
assert.ok(statSync('data/kanji.json').size <= 2.5e6);
assert.ok(K.length > 250 && K.every(k => k.s.length && k.m.length && /^k-\p{Script=Han}$/u.test(k.id)));
assert.equal(K[0].j, 5, 'N5 first');
assert.equal(K.find(k => k.k === '日').s.length, 4, 'stroke count from KanjiVG');
assert.equal(item('k-日').kind, 'kanji');
assert.deepEqual(ladderFor(item('k-日')).map(r => r[0]), ['see', 'sound', 'trace']);
assert.equal(kanjiReading(item('k-日')), 'ニチ');
assert.equal(kanjiReading({ on: [], kun: ['み.る'] }), 'みる');

// A kanji unlocks only once a word using it has a card.
const nichi = JSON.parse(readFileSync('data/words.json', 'utf8')).find(x => x.w === '日本');
assert.deepEqual(kanjiReady({}, K), [], 'nothing learned, nothing unlocked');
const cards = { [nichi.id]: {} };
assert.deepEqual(kanjiReady(cards, K).sort(), ['k-日', 'k-本'].sort());
assert.deepEqual(kanjiReady({ ...cards, 'k-日': {} }, K), ['k-本'], 'already carded kanji drop out');
assert.ok(nextNew(cards, 5, { kanji: K }).filter(id => id.startsWith('k-')).length === 2, 'up to a quarter of the batch (rounded up)');

// Kanji cards survive a backup round trip.
assert.ok(revive({ cards: { 'k-日': { stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 1, lapses: 0, state: 1, due: '2026-01-01' } } }).cards['k-日']);
console.log('kanji ok');
