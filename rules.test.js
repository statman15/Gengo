import assert from 'node:assert/strict';
import { RULES, rulesFor } from './rules.js';
import { PHRASES, said } from './phrases.js';
import { KANA, HINT, LOOK } from './kana.js';
import { heardWord } from './speech.js';
import { revive } from './store.js';

const KANAONLY = /^[ぁ-ゖァ-ヺー、 ]+$/u;
for (const r of RULES) {
  assert.ok(/^r-[a-z-]+$/.test(r.id) && r.title && r.explain && r.acts.length, r.id);
  for (const e of r.ex) {
    assert.equal(e.k.length, e.r.length, `${r.id} ${e.k[0]}: one romaji per kana`);
    assert.equal(new Set(e.r).size, e.r.length, `${r.id} ${e.k[0]}: distinct romaji choices`);
    if (r.acts.includes('hear')) assert.equal(new Set(e.k).size, e.k.length, `${r.id} ${e.k[0]}: distinct kana choices`);
    assert.ok(e.k.every(k => KANAONLY.test(k)), `${r.id}: kana only`);
  }
}
assert.deepEqual(rulesFor('しゃしん'), ['r-youon']);
assert.deepEqual(rulesFor('チェックイン'), ['r-sokuon', 'r-kata-ext']);
assert.deepEqual(rulesFor('コーヒー'), ['r-long']);
assert.deepEqual(rulesFor('すし'), []);

assert.equal(new Set(PHRASES.map(p => p.id)).size, PHRASES.length, 'unique phrase ids');
assert.equal(new Set(PHRASES.map(p => p.m[0])).size, PHRASES.length, 'unique meanings, so a meaning choice has one right answer');
assert.equal(new Set(PHRASES.map(p => said(p.r))).size, PHRASES.length, 'unique readings');
for (const p of PHRASES) {
  assert.ok(KANAONLY.test(p.r), `${p.id}: kana only`);
  assert.ok(/^[a-z ,]+$/.test(p.ro), `${p.id}: plain romaji`);
}
const arigatou = PHRASES.find(p => p.id === 'p-arigatou-gozaimasu');
assert.ok(heardWord(['ありがとうございます'], { r: arigatou.r, w: arigatou.jw }), 'spaces in the phrase are ignored');
assert.ok(heardWord(['有難うございます。'], { r: arigatou.r, w: arigatou.jw }), 'the kanji spelling matches too');
assert.ok(!heardWord(['ありがとう'], { r: arigatou.r, w: arigatou.jw }));

const basic = KANA.filter((k, i) => i % 71 < 46);
assert.ok(basic.every(k => HINT[k.kana]), 'every basic kana has a hint');
assert.ok(LOOK.join('').split('').every(c => KANA.some(k => k.kana === c)), 'look-alikes are real kana');

const c = { stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 1, lapses: 0, state: 1, due: '2026-01-01' };
assert.deepEqual(Object.keys(revive({ cards: { 'p-hai': c, 'r-youon': c, 'p-nope': c, 'r-nope': c } }).cards), ['p-hai', 'r-youon'], 'backups keep phrase and rule cards');
console.log('rules ok');
