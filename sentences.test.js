import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { GRAMMAR } from './grammar.js';
import { tokenReading, readable, best } from './sentences.js';

assert.equal(tokenReading('戻ります', '戻る', 'もどる'), 'もどります');
assert.equal(tokenReading('学生', '学生', 'がくせい'), 'がくせい');
assert.equal(tokenReading('すぐに', '直ぐに', 'すぐに'), 'すぐに');
assert.equal(tokenReading('食べた', '食べる', 'たべる'), 'たべた');
assert.equal(tokenReading('来ます', '来る', 'くる'), null); // irregular stem: sentence dropped
const s = { en: 'I am a student.', t: [['私', 'わたし', 'w-1'], ['は', 'は', ''], ['学生', 'がくせい', 'w-2'], ['です', 'です', ''], ['。', '', '.']], g: ['g-wa-desu'] };
assert.equal(readable(s, id => id === 'w-1'), false);
assert.equal(readable(s, () => true), true);
assert.equal(best([s, { ...s, t: s.t.slice(2) }], id => id === 'w-2', () => 0), s); // tie on 1 known: rand 0 picks the first
assert.equal(best([], () => true, Math.random), null);
// the shipped file
const data = JSON.parse(readFileSync('data/sentences.json', 'utf8'));
assert.ok(statSync('data/sentences.json').size <= 3e6);
for (const x of data.slice(0, 500)) assert.ok(x.en && x.t.length && x.t.every(([sf, , id]) => sf && typeof id === 'string'));
// The first 15 points were picked for by the full build (60 sentences each); later ones are tagged offline from what is
// already there (scripts/grammar-tags.mjs) and fall back to their own examples when few or none match.
const tags = p => data.filter(x => x.g.includes(p.id)).length;
for (const p of GRAMMAR.slice(0, 15)) assert.ok(tags(p) >= 20, p.id);
assert.ok(GRAMMAR.filter(p => tags(p) >= 10).length >= 70, 'most points have Tatoeba sentences');
const ni = data.filter(x => x.t.some(([sf]) => sf === 'には')); assert.ok(ni.length && ni.every(x => x.t.filter(([sf]) => sf === 'には').every(([, , id]) => id === ''))); // compound particle is grammar, not a word
console.log('sentences.test.js ok');
{ // best prefers a sentence you can read: タブー loses to a kana-only one when katakana isn't learned, even with fewer known words
  const { best } = await import('./sentences.js');
  const a = { t: [['タブー', '', ''], ['です', '', ''], ['犬', 'いぬ', 'w-1']] }, b = { t: [['いい', '', ''], ['です', '', '']] };
  const noKata = t => !/[ァ-ヺ]/.test(t);
  assert.equal(best([a, b], id => id === 'w-1', () => 0, noKata), b);
  assert.equal(best([a, b], id => id === 'w-1', () => 0), a, 'without reads, most known words wins as before');
}
console.log('best ok');
