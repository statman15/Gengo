import assert from 'node:assert/strict';
import { toHira, heardMatches } from './speech.js';

assert.equal(toHira('シャツ'), 'しゃつ');
assert.equal(toHira('コーヒー'), 'こーひー');
assert.equal(heardMatches(['あ'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['ア'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['a'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['かあ'], {kana: 'か', sound: 'ka'}), true);   // long vowel still passes
assert.equal(heardMatches(['カー'], {kana: 'か', sound: 'ka'}), true);
assert.equal(heardMatches(['KA '], {kana: 'か', sound: 'ka'}), true);
assert.equal(heardMatches(['き'], {kana: 'か', sound: 'ka'}), false);
assert.equal(heardMatches(['き', 'か'], {kana: 'か', sound: 'ka'}), true);
assert.equal(heardMatches([], {kana: 'か', sound: 'ka'}), false);
console.log('speech ok');
