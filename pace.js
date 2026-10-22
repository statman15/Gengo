// The learning timeline: kana by about week 3, N5 by about month 6, N4 by about month 12 (Travel puts its travel set,
// phrases and travel words, first: about month 2; with no kanji or grammar cards it still reaches N5 by month 6). Each stage has a daily
// new-item budget, scaled by how many answers were right over the last week, so a struggling learner slows down
// and a strong one speeds up. Past the budget, Today offers practice instead of new items.
import { TUNING } from './srs.js';
import { LEARN } from './rules.js';
import { PHRASES } from './phrases.js';
import { TRAVEL_IDS } from './travel.js';
import { NUMBERS } from './numbers.js';

const KANA = { id: 'kana', name: 'Kana', by: 21, perDay: 9, target: 'week 3' };
export const STAGES = [KANA, { id: 'n5', name: 'N5 basics', by: 180, perDay: 6, target: 'month 6' }, { id: 'n4', name: 'N4', by: 365, perDay: 4, target: 'month 12' }];
export const TRAVEL_STAGES = [KANA, { id: 'travel', name: 'Travel set', by: 60, perDay: 7, target: 'month 2' }, ...STAGES.slice(1)];
const SET = [...PHRASES.map(p => p.id), ...TRAVEL_IDS, ...NUMBERS.filter(n => n.travel).map(n => n.id)];

const DAY = 864e5;
const dayStart = key => new Date(key + 'T00:00:00');
const level = (cards, words, j) => { const ws = words.filter(w => w.j === j); return ws.length ? ws.filter(w => cards[w.id]).length / ws.length : 1; };

// Where you are: the stage, how much of it has a card (0-1) and the track's stage list. A level counts as done at 90%.
export function stage(cards, words, travel = false) {
  const list = travel ? TRAVEL_STAGES : STAGES, at = (id, done) => ({ ...list.find(x => x.id === id), done, list });
  const kana = LEARN.filter(id => cards[id]).length / LEARN.length;
  if (kana < 1) return at('kana', kana);
  const set = SET.filter(id => cards[id]).length / SET.length;
  if (travel && set < 0.9) return at('travel', set / 0.9);
  const n5 = level(cards, words, 5);
  if (n5 < 0.9) return at('n5', n5 / 0.9);
  return at('n4', Math.min(1, level(cards, words, 4) / 0.9));
}

// Share of graded answers that were right over the last 7 days, or null with fewer than 20 answers.
export function accuracy(days, now) {
  let right = 0, all = 0;
  for (const [k, d] of Object.entries(days)) if (+now - dayStart(k) < 7 * DAY) { right += d.right ?? 0; all += d.graded ?? 0; }
  return all >= 20 ? right / all : null;
}

export const scale = acc => acc == null ? 1 : TUNING.paceScale.find(([min]) => acc >= min)[1];

// New items still allowed today. load = cards due within the next day: past loadCap new items slow to a trickle,
// past twice that they pause until the backlog shrinks, so the daily reviews stay manageable.
export function budget(cards, words, days, now, todayKey, load = 0, travel = false) {
  const s = stage(cards, words, travel), learned = days[todayKey]?.learned ?? 0, pace = Math.round(s.perDay * scale(accuracy(days, now)));
  const cap = load >= 2 * TUNING.loadCap ? 0 : load >= TUNING.loadCap ? Math.min(pace, TUNING.loadTrickle) : pace;
  return Math.max(0, cap - learned);
}

// One line for the Journey: the stage, its share done, and whether that's ahead of, on or behind the timeline.
export function paceLine(cards, words, days, now, travel = false) {
  const s = stage(cards, words, travel), keys = Object.keys(days).sort(), start = keys.length ? dayStart(keys[0]) : now;
  const day = Math.floor((+now - start) / DAY) + 1, from = s.list[s.list.findIndex(x => x.id === s.id) - 1]?.by ?? 0;
  const expected = Math.min(1, Math.max(0, (day - from) / (s.by - from)));
  const state = s.done >= expected + 0.1 ? 'ahead of pace' : s.done + 0.1 < expected ? 'behind pace, take your time' : 'on pace';
  const acc = accuracy(days, now);
  return { stage: s, day, text: `${s.name}: ${Math.round(s.done * 100)}% · day ${day} · ${state} (target ${s.target})`,
    accuracy: acc == null ? '' : `${Math.round(acc * 100)}% right this week` };
}
