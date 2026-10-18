import assert from 'node:assert/strict';
import { newer } from './update.js';
assert(newer('1.0.10', '1.0.9'));
assert(!newer('1.0.2', '1.0.2'));
assert(newer('2.0.0', '1.9.9'));
assert(!newer('1.9.9', '2.0.0'));
assert(!newer('dev', '1.0.0') && !newer('1.0.0', 'dev') && !newer('dev', 'dev')); // NaN never compares greater
console.log('update.test.js ok');
