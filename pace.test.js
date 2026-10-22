import assert from 'node:assert/strict';
import { stage, accuracy, scale, budget, paceLine } from './pace.js';
import { LEARN } from './rules.js';
import { revive } from './store.js';

const now = new Date('2026-11-10T09:00:00'), all = o => Object.fromEntries(LEARN.map(id => [id, {}])), words = [
  ...Array.from({ length: 10 }, (_, i) => ({ id: 'w-5' + i, j: 5 })), ...Array.from({ length: 10 }, (_, i) => ({ id: 'w-4' + i, j: 4 }))];
assert.equal(stage({}, words).id, 'kana');
assert.equal(stage(all(), words).id, 'n5');
const n5 = { ...all(), ...Object.fromEntries(words.slice(0, 9).map(w => [w.id, {}])) };
assert.equal(stage(n5, words).id, 'n4', 'N5 counts as done at 90% of its words');

const day = (k, d) => [k, { reviews: d.graded, cleared: true, ...d }];
assert.equal(accuracy({}, now), null);
assert.equal(accuracy(Object.fromEntries([day('2026-11-09', { graded: 19, right: 19 })]), now), null, 'fewer than 20 answers: no verdict');
assert.equal(accuracy(Object.fromEntries([day('2026-11-09', { graded: 30, right: 27 }), day('2026-10-01', { graded: 50, right: 0 })]), now), 0.9, 'only the last 7 days');
assert.deepEqual([null, 0.95, 0.9, 0.8, 0.5].map(scale), [1, 1.25, 1, 0.75, 0.5]);

assert.equal(budget({}, words, {}, now, '2026-11-10'), 9, 'kana stage: 9 a day');
const struggling = Object.fromEntries([day('2026-11-09', { graded: 40, right: 24 }), day('2026-11-10', { graded: 0, right: 0, learned: 2 })]);
assert.equal(budget({}, words, struggling, now, '2026-11-10'), 3, '60% right halves the pace (5 of 9, rounded), minus 2 already learned');
const strong = Object.fromEntries([day('2026-11-09', { graded: 40, right: 39 })]);
assert.equal(budget(all(), words, strong, now, '2026-11-10'), 8, 'N5 at 6 a day, +25% when nearly everything is right');

assert.match(paceLine({}, words, { '2026-11-01': { reviews: 0, cleared: false } }, now).text, /^Kana: 0% · day 10 · behind pace/);
assert.match(paceLine(all(), words, { '2026-11-01': { reviews: 0, cleared: false } }, now).text, /^N5 basics: 0% · day 10 · on pace/);

const kept = revive({ days: { '2026-11-09': { reviews: 3, cleared: true, learned: 5, graded: 3, right: 2, junk: 1 } } }).days['2026-11-09'];
assert.deepEqual(kept, { reviews: 3, cleared: true, learned: 5, graded: 3, right: 2 }, 'pace counters survive a backup');
assert.equal(budget({}, words, {}, now, '2026-11-10', 49), 9);
assert.equal(budget({}, words, {}, now, '2026-11-10', 50), 2, '50+ reviews due tomorrow: a trickle of 2');
assert.equal(budget({}, words, {}, now, '2026-11-10', 100), 0, '100+: new items pause');
console.log('pace ok');
