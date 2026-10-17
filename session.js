import { isDue } from './srs.js';
import { KANA } from './kana.js';

// Due card ids, most overdue first.
export const dueQueue = (cards, now) =>
  Object.keys(cards).filter(id => isDue(cards[id], now)).sort((a, b) => new Date(cards[a].due) - new Date(cards[b].due));

// The first n KANA ids that have no card yet, in KANA order.
export const nextNew = (cards, n) => KANA.map(k => k.id).filter(id => !cards[id]).slice(0, n);

const shuffle = (a, rand) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// 4 distinct items of item's script (distinct sounds too, so romaji choices never repeat), shuffled.
export function choices(item, pool, rand) {
  const seen = new Set([item.sound]), others = [];
  for (const x of shuffle(pool.filter(x => x.script === item.script), rand))
    if (others.length < 3 && !seen.has(x.sound)) { seen.add(x.sound); others.push(x); }
  return shuffle([item, ...others], rand);
}
