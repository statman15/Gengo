import assert from 'node:assert/strict';
import { NUMBERS, yomi, fun, nichi, gatsu, readingChoices, shownChoices, heardNumber } from './numbers.js';

const r = (k, v) => NUMBERS.find(x => x.id === k).read(v);
assert.deepEqual([0, 4, 7, 9, 10, 11, 20, 47, 99].map(n => yomi(n)), ['ぜろ', 'よん', 'なな', 'きゅう', 'じゅう', 'じゅういち', 'にじゅう', 'よんじゅうなな', 'きゅうじゅうきゅう']);
assert.deepEqual([100, 300, 600, 800, 999].map(n => yomi(n)), ['ひゃく', 'さんびゃく', 'ろっぴゃく', 'はっぴゃく', 'きゅうひゃくきゅうじゅうきゅう']);
assert.deepEqual([1000, 3000, 8000, 1280, 10000, 35000, 100000 - 1].map(n => yomi(n)),
  ['せん', 'さんぜん', 'はっせん', 'せんにひゃくはちじゅう', 'いちまん', 'さんまんごせん', 'きゅうまんきゅうせんきゅうひゃくきゅうじゅうきゅう']);
assert.equal(yomi(300, true), 'さんひゃく');
assert.deepEqual([350, 104, 1280].map(n => r('n-yen', n)), ['さんびゃくごじゅうえん', 'ひゃくよえん', 'せんにひゃくはちじゅうえん']);
assert.deepEqual([[4, 0], [7, 30], [9, 0]].map(v => r('n-ji', v)), ['よじ', 'しちじはん', 'くじ']);
assert.deepEqual([1, 3, 6, 8, 10, 15, 20, 45].map(fun), ['いっぷん', 'さんぷん', 'ろっぷん', 'はっぷん', 'じゅっぷん', 'じゅうごふん', 'にじゅっぷん', 'よんじゅうごふん']);
assert.equal(r('n-fun', [3, 15]), 'さんじじゅうごふん');
assert.deepEqual([1, 2, 3, 4, 7].map(n => r('n-nin', n)), ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ななにん']);
assert.deepEqual([1, 3, 8, 10].map(n => r('n-tsu', n)), ['ひとつ', 'みっつ', 'やっつ', 'とお']);
assert.deepEqual([4, 7, 9, 11].map(gatsu), ['しがつ', 'しちがつ', 'くがつ', 'じゅういちがつ']);
assert.deepEqual([1, 2, 10, 11, 14, 17, 19, 20, 24, 31].map(nichi), ['ついたち', 'ふつか', 'とおか', 'じゅういちにち', 'じゅうよっか', 'じゅうしちにち', 'じゅうくにち', 'はつか', 'にじゅうよっか', 'さんじゅういちにち']);
assert.deepEqual(['1本', '3本', '6本', '2枚'].map(s => r('n-hon-mai', s)), ['いっぽん', 'さんぼん', 'ろっぽん', 'にまい']);
assert.equal(r('n-youbi', 1), 'げつようび');

// every lesson: 4 distinct choices containing the answer, never another correct reading, over many draws
let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const L of NUMBERS) {
  assert.ok(L.title && L.explain && L.ex.length === 4, L.id);
  for (let t = 0; t < 200; t++) {
    const v = L.gen(rand), rc = readingChoices(L, v, rand), sc = shownChoices(L, v, rand);
    assert.equal(rc.length, 4, `${L.id} ${L.show(v)}: ${rc}`); assert.equal(new Set(rc).size, 4); assert.ok(rc.includes(L.read(v)));
    assert.ok(!rc.some(x => (L.alt?.(v) ?? []).includes(x)), `${L.id}: alt reading offered as wrong`);
    assert.equal(sc.length, 4, `${L.id} shown`); assert.equal(new Set(sc).size, 4); assert.ok(sc.includes(L.show(v)));
    assert.match(L.read(v), /^[ぁ-ゖー]+$/, `${L.id} reading is hiragana`);
  }
}
const yen = NUMBERS.find(x => x.id === 'n-yen');
assert.ok(heardNumber(['350円'], yen, 350)); assert.ok(heardNumber(['さんびゃくごじゅうえん'], yen, 350)); assert.ok(!heardNumber(['530円'], yen, 350));
assert.ok(heardNumber(['3時15分'], NUMBERS.find(x => x.id === 'n-fun'), [3, 15]));
assert.ok(heardNumber(['月曜日'], NUMBERS.find(x => x.id === 'n-youbi'), 1));
console.log('numbers ok');
