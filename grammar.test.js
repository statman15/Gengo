import assert from 'node:assert/strict';
import { GRAMMAR } from './grammar.js';

assert.equal(GRAMMAR.length, 89);
assert.equal(new Set(GRAMMAR.map(p => p.id)).size, GRAMMAR.length);
assert.deepEqual([5, 4].map(j => GRAMMAR.filter(p => p.jlpt === j).length), [51, 38], 'N5 then N4');
GRAMMAR.forEach((p, i) => i && assert.ok(p.jlpt <= GRAMMAR[i - 1].jlpt, `${p.id}: N5 before N4`));
GRAMMAR.forEach((p, i) => i && assert.ok(p.words > GRAMMAR[i - 1].words, `${p.id} words increase`));

const KANA = /^[ぁ-ゖァ-ヺー \[\]？。、]+$/;
const toks = jp => jp.replace(/[\[\]]/g, '').split(' ').filter(Boolean).map(t => ({ h: t, s: t, f: '' }));

for (const p of GRAMMAR) {
  assert.ok(p.ex.length >= 2 && p.ex.length <= 3, `${p.id} has 2-3 examples`);
  assert.ok(p.title && p.en && p.explain && p.acts.length, p.id);
  for (const e of p.ex) {
    assert.match(e.jp, KANA, `${p.id}: ${e.jp}`);
    assert.ok(e.en, p.id);
    assert.ok(p.match(toks(e.jp)), `${p.id} matches its own example: ${e.jp}`);
  }
  assert.equal(p.match([{ h: '猫', s: '猫', f: 'n' }]), false, `${p.id} rejects 猫`);
  if (p.acts.includes('fill')) {
    assert.equal(new Set(p.choices).size, 4, `${p.id} choices distinct`);
    for (const e of p.ex) {
      const b = [...e.jp.matchAll(/\[([^\]]+)\]/g)];
      assert.equal(b.length, 1, `${p.id}: one blank in ${e.jp}`);
      assert.equal(b[0][1], p.choices[0], `${p.id}: blank is the answer`);
    }
  }
  if (p.acts.includes('form')) {
    assert.equal(new Set(p.forms).size, 4, `${p.id} forms distinct`);
    assert.ok(p.pos?.length, `${p.id} has pos`);
  }
}
console.log('grammar ok');
