import assert from 'node:assert/strict';
import { blankIndex, formWords, canGrammar, lessonHtml } from './grammar-acts.js';
import { GRAMMAR } from './grammar.js';

const t = [['私', 'わたし', 'w-1'], ['は', 'は', ''], ['は', 'は', ''], ['。', '', '.']];
assert.equal(blankIndex(t, 'は'), 1);
assert.equal(blankIndex([['は', 'は', 'w-2']], 'は'), -1, 'a word is not a grammar token');

const masu = GRAMMAR.find(g => g.id === 'g-masu'), adj = GRAMMAR.find(g => g.id === 'g-adj');
const words = [{ id: 'w-1', w: '食べる', r: 'たべる', f: 'v1' }, { id: 'w-2', w: '高い', r: 'たかい', f: 'adj-i' }, { id: 'w-3', w: '本', r: 'ほん', f: 'n' }, { id: 'w-4', w: '行く', r: 'いく', f: 'v5k-s' }, { id: 'w-5', w: '勉強', r: 'べんきょう', f: 'vs' }];
const cards = { 'w-1': {}, 'w-2': {}, 'w-3': {}, 'w-5': {} };
assert.deepEqual(formWords(masu, cards, words).map(w => w.id), ['w-1'], 'learned verbs only; vs and unlearned drop out');
assert.deepEqual(formWords(adj, cards, words).map(w => w.id), ['w-2']);
assert.equal(canGrammar(masu, {})('form'), false, 'no loaded words');
assert.equal(canGrammar(masu, {})('build'), true);
assert.match(lessonHtml({ title: '<b>', en: 'x', explain: 'y', ex: [{ jp: 'a [b] 。', en: 'z' }] }), /&#60;b&#62;[\s\S]*ab。/);
