import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ready, item, loadedKanji, ladderFor } from './items.js';
import { kanjiReady, nextNew } from './session.js';
import { kanjiReading, kanjiWords } from './activities.js';
import { BASIC } from './rules.js';
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
const kana = Object.fromEntries(BASIC.map(id => [id, {}])), cards = { ...kana, [nichi.id]: {} };
assert.deepEqual(kanjiReady({ [nichi.id]: {} }, K), [], 'kanji wait until both basic kana sets are learned');
assert.deepEqual(kanjiReady(cards, K).sort(), ['k-日', 'k-本'].sort());
assert.deepEqual(kanjiReady({ ...cards, 'k-日': {} }, K), ['k-本'], 'already carded kanji drop out');
assert.ok(nextNew(cards, 5, { kanji: K }).filter(id => /^k-\p{Script=Han}/u.test(id)).length === 1, 'a quarter of the batch, rounded down (at least one)');

// The reading drill uses your own word with the kanji: 日本 for 日 (the word that is just the kanji would come first).
assert.deepEqual(kanjiWords(item('k-日'), id => id === nichi.id).map(w => w.w), ['日本']);

// Kanji cards survive a backup round trip.
assert.ok(revive({ cards: { 'k-日': { stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 1, lapses: 0, state: 1, due: '2026-01-01' } } }).cards['k-日']);
assert.equal(kanjiReading({ id: 'g-wa-desu', kind: 'grammar' }), '', 'a grammar point has no reading (learn view crash)');
console.log('kanji ok');
