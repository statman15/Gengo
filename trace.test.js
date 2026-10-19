import assert from 'node:assert/strict';
import { resample, strokeScore } from './trace.js';

const L = resample([[0, 0], [10, 0], [10, 10]], 5);
assert.deepEqual(L[0], [0, 0]);
assert.deepEqual(L[4], [10, 10]);
assert.deepEqual(L.map(p => p.map(Math.round)), [[0, 0], [5, 0], [10, 0], [10, 5], [10, 10]]);
assert.deepEqual(resample([[3, 4]], 3), [[3, 4], [3, 4], [3, 4]]);
assert.deepEqual(resample([[3, 4], [3, 4]], 2), [[3, 4], [3, 4]]);

const a = resample([[0, 0], [20, 0]], 8);
assert.equal(strokeScore(a, a), 0);
assert.ok(strokeScore(a, [...a].reverse()) > 8);
assert.ok(strokeScore(a, resample([[0, 2], [20, 2]], 8)) < 3);
console.log('trace ok');
