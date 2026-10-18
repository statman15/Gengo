import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { kanaIds, eligible, search, meaningChoices, loadWords } from './words.js';

const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

assert.deepEqual(kanaIds('きって'), ['h-ki', 'h-tsu', 'h-te']);
assert.deepEqual(kanaIds('しゃしん'), ['h-shi', 'h-ya', 'h-n']);
assert.deepEqual(kanaIds('コーヒー'), ['k-ko', 'k-hi']);
assert.deepEqual(kanaIds('ヴァイオリン'), ['k-u', 'k-a', 'k-i', 'k-o', 'k-ri', 'k-n']);
const cards = Object.fromEntries(['h-ki', 'h-tsu'].map(id => [id, {}]));
assert.equal(eligible({r: 'きって'}, cards), false);
assert.equal(eligible({r: 'きって'}, {...cards, 'h-te': {}}), true);
const W = [{id: 'w-1', r: 'がくせい', w: '学生', m: ['student'], p: 'n'}, {id: 'w-2', r: 'いく', w: '行く', m: ['to go'], p: 'v'},
  {id: 'w-3', r: 'まいる', w: '参る', m: ['to go', 'to come'], p: 'v'}, {id: 'w-4', r: 'たべる', w: '食べる', m: ['to eat'], p: 'v'},
  {id: 'w-5', r: 'のむ', w: '飲む', m: ['to drink'], p: 'v'}, {id: 'w-6', r: 'みる', w: '見る', m: ['to see'], p: 'v'}];
assert.equal(search(W, '学生')[0].id, 'w-1');
assert.equal(search(W, 'がくせい')[0].id, 'w-1');
assert.equal(search(W, 'student')[0].id, 'w-1');
assert.deepEqual(search(W, '  '), []);
for (let s = 1; s < 50; s++) {
  const c = meaningChoices(W[1], W, mulberry(s));
  assert.equal(c.length, 4); assert.ok(c.includes(W[1])); assert.ok(!c.includes(W[2])); // 参る shares "to go"
  assert.ok(c.every(x => x.p === 'v'));
}
// loader resolves [] on failure
assert.deepEqual(await loadWords(() => Promise.reject(new Error('offline'))), []);
assert.deepEqual(await loadWords(async () => ({ ok: false })), []);
// the shipped file
const data = JSON.parse(readFileSync('data/words.json', 'utf8'));
assert.ok(statSync('data/words.json').size <= 2.5e6);
assert.equal(new Set(data.map(x => x.id)).size, data.length);
assert.ok(data.slice(0, 50).every(x => x.j === 5));
assert.ok(!data.some(x => ['prt', 'cop'].includes(x.f) || x.f.startsWith('aux')));
assert.ok(data.find(x => x.w === '学生' && x.r === 'がくせい'));
console.log('words ok');
