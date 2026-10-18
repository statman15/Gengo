import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conjugate, FORMS } from './conjugate.js';
import { GRAMMAR } from './grammar.js';

const t = (w, p, f, want) => assert.equal(conjugate(w, p, f), want, `${w} ${f}`);
t('たべる', 'v1', 'masu', 'たべます'); t('たべる', 'v1', 'te', 'たべて'); t('たべる', 'v1', 'masendeshita', 'たべませんでした');
t('のむ', 'v5m', 'te', 'のんで'); t('のむ', 'v5m', 'ta', 'のんだ'); t('かう', 'v5u', 'nai', 'かわない');
t('まつ', 'v5t', 'te', 'まって'); t('かえる', 'v5r', 'masu', 'かえります'); t('かく', 'v5k', 'te', 'かいて');
t('いく', 'v5k-s', 'te', 'いって'); t('行く', 'v5k-s', 'ta', '行った'); t('およぐ', 'v5g', 'te', 'およいで');
t('はなす', 'v5s', 'te', 'はなして'); t('しぬ', 'v5n', 'te', 'しんで'); t('あそぶ', 'v5b', 'tai', 'あそびたい');
t('ある', 'v5r-i', 'nai', 'ない'); t('する', 'vs-i', 'masu', 'します'); t('べんきょうする', 'vs-i', 'te', 'べんきょうして');
t('くる', 'vk', 'masu', 'きます'); t('くる', 'vk', 'nai', 'こない'); t('来る', 'vk', 'te', '来て');
t('たかい', 'adj-i', 'adj-neg', 'たかくないです'); t('たかい', 'adj-i', 'adj-past', 'たかかったです');
t('いい', 'adj-ix', 'adj-neg', 'よくないです'); t('たかい', 'adj-i', 'masu', null); t('ねこ', 'n', 'te', null);
t('たかい', 'adj-i', 'adj', 'たかいです'); t('たかい', 'adj-i', 'adj-past-neg', 'たかくなかったです');
t('いい', 'adj-ix', 'adj', 'いいです'); t('良い', 'adj-ix', 'adj', '良いです'); t('いい', 'adj-ix', 'adj-past', 'よかったです');
t('いい', 'adj-ix', 'adj-past-neg', 'よくなかったです'); t('たべる', 'v1', 'toString', null);
t('たべる', 'v1', 'dict', 'たべる'); t('する', 'vs-i', 'nai', 'しない');

// every form id used by grammar.js exists
for (const p of GRAMMAR) for (const f of p.forms || []) assert.ok(f in FORMS, f);

// real data: N5 coverage
const words = JSON.parse(readFileSync(new URL('./data/words.json', import.meta.url)));
const isV = f => /^(v1|v5|vk|vs-i)/.test(f);
for (const [pred, form] of [[isV, 'masu'], [isV, 'te'], [f => f === 'adj-i' || f === 'adj-ix', 'adj-neg']]) {
  const n5 = words.filter(x => x.j === 5 && pred(x.f));
  const ok = n5.filter(x => conjugate(x.r, x.f, form) !== null).length;
  assert.ok(ok / n5.length >= 0.95, `${form}: ${ok}/${n5.length}`);
}
console.log('conjugate ok');
