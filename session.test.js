import assert from 'node:assert/strict';
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { newCard, pickRung, TUNING } from './srs.js';
import { dueQueue, nextNew, grammarReady, choices, kanjiReady } from './session.js';
import { RULES, LEARN, BASIC } from './rules.js';
import { PHRASES } from './phrases.js';
import { NUMBERS } from './numbers.js';
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
assert.deepEqual(nextNew({}, 5), ['p-hai', 'h-a', 'h-i', 'h-u', 'h-e'], 'a phrase from day one, then hiragana');
assert.deepEqual(nextNew({ 'h-a': {}, 'h-u': {} }, 3), ['p-hai', 'h-i', 'h-e']);
assert.equal(nextNew({}, 10).filter(id => id.startsWith('p-')).length, 1, 'one phrase a batch while kana remain');
assert.equal(nextNew(Object.fromEntries(LEARN.map(id => [id, {}])), 10).filter(id => id.startsWith('p-')).length, 2, 'two in a batch of 10 after kana');

const W = (id, r) => ({ id, r }), words = [W('w-1', 'あお'), W('w-2', 'アイス'), W('w-3', 'いえ')];
const card = () => newCard(now);
const hiraIds = KANA.filter(k => k.script === 'hira').map(k => k.id);
assert.equal(hiraIds.length, 71);
const said = Object.fromEntries(PHRASES.map(p => [p.id, card()]));
const hira = { ...said, ...Object.fromEntries(hiraIds.map(id => [id, card()])) };
assert.deepEqual(nextNew(hira, 4, { words }), ['r-particles', 'w-1', 'w-3'], 'the hiragana rules follow hiragana, one per batch, nothing past the next rule');
const allKana = { ...said, ...Object.fromEntries([...KANA, ...RULES, ...NUMBERS].map(k => [k.id, card()])) };
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
  const cards = { ...said, 'h-a': {}, 'h-i': {}, 'h-u': {}, 'h-e': {}, 'h-o': {}, 'h-ka': {}, 'w-い': {} };
  for (const n of [1, 3, 4]) {
    const ws = words.filter(w => !cards[w.id] && eligible(w, cards)).map(w => w.id), rest = n;
    const kana = LEARN.filter(id => !cards[id]).slice(0, 46), k = Math.min(kana.length, Math.max(Math.ceil(rest * 3 / 4), rest - ws.length));
    assert.deepEqual(nextNew(cards, n, { words }), [...kana.slice(0, k), ...ws.slice(0, rest - k)]);
  }
}
// Learn order: 46 hiragana, the five hiragana rules, then katakana woven with hiragana ゛゜; every kana and rule exactly once.
assert.deepEqual(LEARN.slice(46, 51), ['r-particles', 'r-marks', 'r-sokuon', 'r-youon', 'r-long']);
assert.equal(LEARN[51], 'h-ga');
assert.ok(LEARN.slice(51, 54).includes('k-a'), 'katakana starts right after the hiragana rules');
assert.deepEqual([...LEARN].sort(), [...KANA.map(k => k.id), ...RULES.map(r => r.id)].sort());
assert.equal(LEARN.at(-1), 'r-kata-ext');
// Words needing a rule wait for it; a word a phrase already teaches is skipped.
const ky = [W('w-k', 'きって'), W('w-s', 'しゃしん'), W('w-h', 'はい'), W('w-x', 'すし')];
const hiraOnly = { ...hira, ...Object.fromEntries(['r-particles', 'r-marks'].map(id => [id, card()])) };
assert.deepEqual(nextNew(hiraOnly, 4, { words: ky }).filter(id => id.startsWith('w-')), ['w-x'], 'っ, small ゃ and はい held back');
assert.deepEqual(nextNew({ ...hiraOnly, 'r-sokuon': card(), 'r-youon': card() }, 12, { words: ky }).filter(id => id.startsWith('w-')), ['w-k', 'w-s', 'w-x']);
// Kanji wait for both basic kana sets.
db.custom['c-2'] = { r: 'いえ', w: '家', m: ['house'] };
const ks = [{ id: 'k-家', k: '家' }], wk = { 'c-2': card() };
assert.deepEqual(kanjiReady({ ...hira, ...wk }, ks), [], 'no kanji before katakana');
assert.deepEqual(kanjiReady({ ...Object.fromEntries(BASIC.map(id => [id, card()])), ...wk }, ks), ['k-家']);
// With has(), wrong answers are kana you have, look-alikes first (at most two).
const sa = KANA.find(k => k.kana === 'さ'), haveSaChi = id => ['h-sa', 'h-chi', 'h-ki', 'h-a', 'h-i', 'h-u'].includes(id);
for (let t = 0; t < 20; t++) {
  const c = choices(sa, KANA, rand, haveSaChi).map(x => x.kana);
  assert.ok(c.includes('ち') && c.includes('き'), 'both look-alikes of さ offered');
  assert.ok(c.every(x => 'さちきあいう'.includes(x)), 'only kana you have');
}
console.log('session ok');
{ // an existing learner who already has the word はい (from before phrases) isn't offered the phrase はい
  db.custom['c-3'] = { r: 'はい', w: '', m: ['yes'] };
  assert.ok(!nextNew({ 'c-3': card() }, 5).includes('p-hai'));
  assert.equal(nextNew({ 'c-3': card() }, 5)[0], 'p-iie');
}
{ // knowing only ア and イ, the fillers are unlearned basic katakana, never ガ-style marked ones
  const a = KANA.find(k => k.kana === 'ア'), two = id => id === 'k-a' || id === 'k-i';
  for (let t = 0; t < 20; t++) assert.ok(choices(a, KANA, rand, two).every(x => !/^[gzdbpj]/.test(x.sound)));
}
console.log('phrase skip ok');
{ // review load: cards due within a day; practice takes recent cards first, then the weakest
  const { dueSoon, practiceQueue } = await import('./session.js');
  const ids = KANA.map(k => k.id), at = (d, extra) => ({ ...newCard(now), due: new Date(+now + d * 864e5), ...extra });
  const c = Object.fromEntries(ids.slice(0, 60).map((id, i) => [id, at(i < 49 ? 0.5 : 3)]));
  assert.equal(dueSoon(c, now), 49);
  c[ids[59]] = at(0.9);
  assert.equal(dueSoon(c, now), 50, 'due within a day');
  const p = { 'h-a': at(5, { stability: 9 }), 'h-i': at(5, { stability: 1 }), 'h-u': at(5, { stability: 20, last_review: new Date(+now - 3600e3) }), 'w-404': at(5, { stability: 0 }) };
  assert.deepEqual(practiceQueue(p, now), ['h-u', 'h-i', 'h-a'], 'reviewed today first, then weakest; unknown ids dropped');
}
{ // numbers lessons: none until every hiragana and its rules are known, then one a batch, in order
  const { numberReady } = await import('./session.js');
  const hiraAll = Object.fromEntries([...KANA.filter(k => k.script === 'hira'), ...RULES.slice(0, 5)].map(k => [k.id, card()]));
  assert.equal(numberReady({ ...hiraAll, 'r-long': undefined }), null);
  assert.equal(numberReady(hiraAll), 'n-digits');
  assert.equal(nextNew({ ...hiraAll, ...said }, 5).filter(id => id.startsWith('n-')).length, 1);
  assert.equal(numberReady({ ...hiraAll, 'n-digits': card() }), 'n-tens');
}
console.log('load ok');
