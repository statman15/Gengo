import assert from 'node:assert/strict';
import { ready, item, ladderFor } from './items.js';
import { db } from './store.js';
import { TUNING } from './srs.js';
await ready(async () => { throw new Error('offline'); }); // never rejects
assert.equal(item('w-1'), null);
assert.equal(item('h-a').kind, 'kana');
assert.equal(item('nope'), null);
db.custom['c-1'] = { r: 'ねこ', w: '', m: ['cat'] };
assert.deepEqual([item('c-1').kind, item('c-1').custom, item('c-1').r], ['word', true, 'ねこ']);
assert.equal(item('c-2'), null);
const g = item('g-wa-desu');
assert.equal(g.kind, 'grammar');
assert.deepEqual(ladderFor(g), [['fill', 0], ['build', 5], ['translate', 10]]);
assert.equal(ladderFor(item('h-a')), TUNING.ladder.kana);
assert.equal(ladderFor(item('c-1')), TUNING.ladder.word);
console.log('items ok');
