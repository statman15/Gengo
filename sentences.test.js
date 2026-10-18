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
for (const p of GRAMMAR) assert.ok(data.filter(x => x.g.includes(p.id)).length >= 20, p.id);
console.log('sentences.test.js ok');
