import assert from 'node:assert/strict';
import { dayKey, counts, streak, weekReviews } from './streak.js';

assert.equal(dayKey(new Date(2026, 9, 17, 23, 59)), '2026-10-17');
assert.equal(dayKey(new Date(2026, 9, 18, 0, 1)), '2026-10-18');
assert.equal(counts({reviews: 10, cleared: false}), true);
assert.equal(counts({reviews: 1, cleared: true}), true);
assert.equal(counts({reviews: 0, cleared: true}), false);
assert.equal(counts({reviews: 9, cleared: false}), false);
const ok = {reviews: 12, cleared: true};
const sat = new Date(2026, 9, 17, 9);
// Sat 2026-10-17: Mon 12..Fri 16 all done, today not yet done -> streak 5 (today doesn't break it)
assert.equal(streak({'2026-10-12': ok, '2026-10-13': ok, '2026-10-14': ok, '2026-10-15': ok, '2026-10-16': ok}, sat), 5);
// one missed day in a week is a rest day; two break it
assert.equal(streak({'2026-10-12': ok, '2026-10-14': ok, '2026-10-15': ok, '2026-10-16': ok}, sat), 4);
assert.equal(streak({'2026-10-12': ok, '2026-10-15': ok, '2026-10-16': ok}, sat), 2);
// no counted days, or a miss with nothing counted behind it: no rest-day carry
assert.equal(streak({}, sat), 0);
assert.equal(streak({'2026-10-16': ok}, sat), 1);
assert.equal(streak({'2026-10-16': {reviews: 9}}, sat), 0);
// today counted adds; rest day lasts only within its own Monday-start week
assert.equal(streak({'2026-10-16': ok, '2026-10-17': ok}, sat), 2);
assert.equal(streak({'2026-10-11': ok, '2026-10-13': ok, '2026-10-14': ok, '2026-10-15': ok, '2026-10-16': ok}, sat), 5);
assert.equal(weekReviews({'2026-10-11': ok, '2026-10-12': ok, '2026-10-17': {reviews: 3}}, new Date(2026, 9, 17)), 15);
console.log('streak ok');
