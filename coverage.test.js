import assert from 'node:assert/strict';
import { coverage, fresh } from './coverage.js';
import { KANA } from './kana.js';

const k = { stability: 5 }, cards = ids => Object.fromEntries(ids.map(i => [i, k]));
const zero = coverage({}, [], []);
assert.deepEqual(zero, { hira: 0, kata: 0, n5: 0, n4: 0, grammar: 0, library: 0 });
assert.equal(fresh(zero, []).length, 0);

const hira = coverage(cards(KANA.filter(x => x.script === 'hira').map(x => x.id)), [], []);
assert.equal(hira.hira, 1);
assert(fresh(hira, []).some(m => m.id === 'hira'));
assert(!fresh(hira, ['hira']).some(m => m.id === 'hira'));

const ws = [{ id: 'w-1', j: 5 }, { id: 'w-2', j: 5 }];
assert.equal(coverage(cards(['w-1']), ws, []).n5, 0.5);
const s = [{ t: [['a', 'a', 'w-1'], ['b', 'b', 'w-2']] }];
assert.equal(coverage(cards(['w-1']), ws, s).library, 0);
assert.equal(coverage(cards(['w-1', 'w-2']), ws, s).library, 1);
assert.equal(coverage(cards(['w-1']), ws, []).library, 0);
console.log('PASS coverage');
