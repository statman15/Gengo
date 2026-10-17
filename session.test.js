import assert from 'node:assert/strict';
import { KANA } from './kana.js';
import { newCard, pickRung } from './srs.js';
import { dueQueue, nextNew, choices } from './session.js';
const now = new Date('2026-10-17T10:00:00');
const at = (due, extra = {}) => ({ ...newCard(now), due: new Date(due), ...extra });
assert.deepEqual(dueQueue({
  b: at('2026-10-17T09:00:00'), a: at('2026-10-15T09:00:00'), later: at('2026-10-18T09:00:00'),
}, now), ['a', 'b']);
assert.deepEqual(nextNew({}, 5), ['h-a', 'h-i', 'h-u', 'h-e', 'h-o']);
assert.deepEqual(nextNew({ 'h-a': {}, 'h-u': {} }, 3), ['h-i', 'h-e', 'h-o']);
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const item of KANA) {
  const c = choices(item, KANA, rand);
  assert.equal(new Set(c.map(x => x.id)).size, 4);
  assert.equal(new Set(c.map(x => x.sound)).size, 4); // romaji choices must differ too (ji/zu twins)
  assert.ok(c.every(x => x.script === item.script) && c.includes(item));
}
const none = { canHear: false, canSay: false };
for (const stability of [0, 5, 12, 30]) for (const r of [0, .1, .5, .99])
  assert.ok(!['hear', 'say'].includes(pickRung({ ...newCard(now), stability }, none, () => r).rung));
console.log('session ok');
