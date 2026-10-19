import assert from 'node:assert/strict';
import { cycle } from './keypad.js';
assert.deepEqual(['か', 'が', 'は', 'ば', 'ぱ', 'つ', 'っ', 'づ', 'や', 'ゃ', 'ハ', 'パ', 'ん', 'ー'].map(cycle),
  ['が', 'か', 'ば', 'ぱ', 'は', 'っ', 'づ', 'つ', 'ゃ', 'や', 'バ', 'ハ', 'ん', 'ー']);
console.log('keypad ok');
