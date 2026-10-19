import assert from 'node:assert/strict';
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { newCard, pickRung, TUNING } from './srs.js';
import { dueQueue, nextNew, grammarReady, choices } from './session.js';
import { ready } from './items.js';
import { eligible } from './words.js';
import { db } from './store.js';
const now = new Date('2026-10-17T10:00:00');
const at = (due, extra = {}) => ({ ...newCard(now), due: new Date(due), ...extra });
db.custom['c-1'] = { r: 'ねこ', w: '', m: ['cat'] };
// words w-1..w-200 exist (grammar unlock only counts real words); kanji.json comes back empty
await ready(async u => ({ ok: true, json: async () => u.includes('words') ? Array.from({ length: 200 }, (_, i) => ({ id: 'w-' + (i + 1), r: 'あ', w: '', m: ['x' + i], p: 'n', f: 'n', j: 5 })) : [] }));
assert.deepEqual(dueQueue({
  'h-u': at('2026-10-17T09:00:00'), 'h-a': at('2026-10-15T09:00:00'), 'h-i': at('2026-10-18T09:00:00'),
}, now), ['h-a', 'h-u']);
assert.deepEqual(dueQueue({ 'h-a': at('2026-10-15T09:00:00'), 'w-999': at('2026-10-15T09:00:00') }, now), ['h-a'], 'unknown ids skipped');
assert.deepEqual(nextNew({}, 5), ['h-a', 'h-i', 'h-u', 'h-e', 'h-o']);
assert.deepEqual(nextNew({ 'h-a': {}, 'h-u': {} }, 3), ['h-i', 'h-e', 'h-o']);

const W = (id, r) => ({ id, r }), words = [W('w-1', 'あお'), W('w-2', 'アイス'), W('w-3', 'いえ')];
const card = () => newCard(now);
const hiraIds = KANA.filter(k => k.script === 'hira').map(k => k.id);
assert.equal(hiraIds.length, 71);
const hira = Object.fromEntries(hiraIds.map(id => [id, card()]));
assert.deepEqual(nextNew(hira, 4, { words }), ['k-a', 'k-i', 'w-1', 'w-3']);
const allKana = Object.fromEntries(KANA.map(k => [k.id, card()]));
const five = ['w-1', 'w-2', 'w-3', 'w-4', 'w-5'].map(id => W(id, 'あ'));
assert.deepEqual(nextNew(allKana, 5, { words: five, mine: { words: ['c-1'], grammar: [] } }), ['c-1', 'w-1', 'w-2', 'w-3', 'w-4']);
const withWords = n => ({ ...allKana, ...Object.fromEntries(Array.from({ length: n }, (_, i) => ['w-' + (i + 100), card()])) });
assert.equal(grammarReady(withWords(9), { grammar: [] }), null);
assert.equal(grammarReady(withWords(10), { grammar: [] }).id, 'g-wa-desu');
assert.equal(grammarReady({ ...allKana, 'w-1': card(), 'c-1': card() }, { grammar: [] }), null, 'few words');
assert.equal(grammarReady({ ...withWords(9), 'c-1': card() }, { grammar: [] }).id, 'g-wa-desu', 'c- cards count');
assert.equal(grammarReady({ ...allKana, ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => ['w-9' + i + '00000', card()])) }, { grammar: [] }), null, 'made-up word ids (a junk backup) do not unlock grammar');
assert.equal(nextNew(withWords(10), 5, { words: five })[0], 'g-wa-desu');
assert.equal(grammarReady({ ...withWords(30), 'g-wa-desu': card() }, { grammar: [] }).id, 'g-ka');
assert.equal(grammarReady({ ...withWords(30), 'g-ka': card() }, { grammar: [] }).id, 'g-wa-desu', 'g-ka waits for g-wa-desu');
assert.equal(grammarReady({}, { grammar: ['g-tai'] }).id, 'g-tai');
const two = nextNew(allKana, 5, { words: five, mine: { words: [], grammar: ['g-tai', GRAMMAR[1].id] } });
assert.equal(two.filter(id => id.startsWith('g-')).length, 1, 'one grammar point per batch');

assert.ok(!nextNew(allKana, 5, { words: five, mine: { words: ['c-404', 'w-404'], grammar: [] } }).some(id => id.endsWith('404')), 'unknown personal words skipped');
assert.doesNotThrow(() => nextNew(allKana, 5, { mine: { words: [] } }));
assert.doesNotThrow(() => nextNew(allKana, 5, { mine: { grammar: [] } }));
assert.equal(grammarReady({}, {}), null);
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const item of KANA) {
  const c = choices(item, KANA, rand);
  assert.equal(new Set(c.map(x => x.id)).size, 4);
  assert.equal(new Set(c.map(x => x.sound)).size, 4); // romaji choices must differ too (ji/zu twins)
  assert.ok(c.every(x => x.script === item.script) && c.includes(item));
}
const none = r => r !== 'hear' && r !== 'say';
for (const stability of [0, 5, 12, 30]) for (const r of [0, .1, .5, .99])
  assert.ok(!['hear', 'say'].includes(pickRung({ ...newCard(now), stability }, TUNING.ladder.kana, none, () => r).rung));
{ // early-stopping scan gives the same ids as filtering every word
  const words = ['あ', 'い', 'う', 'え', 'お', 'か', 'あい', 'いえ', 'かお'].map(r => ({ id: 'w-' + r, r }));
  const cards = { 'h-a': {}, 'h-i': {}, 'h-u': {}, 'h-e': {}, 'h-o': {}, 'h-ka': {}, 'w-い': {} };
  for (const n of [1, 3, 4]) {
    const ws = words.filter(w => !cards[w.id] && eligible(w, cards)).map(w => w.id), rest = n;
    const k = Math.min(KANA.filter(x => !cards[x.id]).length, Math.max(Math.ceil(rest / 2), rest - ws.length));
    assert.deepEqual(nextNew(cards, n, { words }), [...KANA.map(x => x.id).filter(id => !cards[id]).slice(0, k), ...ws.slice(0, rest - k)]);
  }
}
console.log('session ok');
