import { isDue } from './srs.js';
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { eligible } from './words.js';
import { item } from './items.js';

// Due card ids, most overdue first.
export const dueQueue = (cards, now) =>
  Object.keys(cards).filter(id => item(id) && isDue(cards[id], now)).sort((a, b) => new Date(cards[a].due) - new Date(cards[b].due));

// The next grammar point to offer: a pulled-forward one, else the first uncarded point once the one before it
// has a card and enough words (w- and c-) have cards.
export function grammarReady(cards, mine = { grammar: [] }) {
  const pulled = mine.grammar.find(id => !cards[id]);
  if (pulled) return GRAMMAR.find(g => g.id === pulled) ?? null;
  const i = GRAMMAR.findIndex(g => !cards[g.id]);
  if (i < 0 || (i && !cards[GRAMMAR[i - 1].id])) return null;
  const n = Object.keys(cards).filter(id => /^[wc]-/.test(id)).length;
  return n >= GRAMMAR[i].words ? GRAMMAR[i] : null;
}

// Up to n new ids: one grammar point first, then personal words, then half kana / half words, either side filling the other.
export function nextNew(cards, n, { words = [], mine = { words: [], grammar: [] } } = {}) {
  const out = [], g = grammarReady(cards, mine);
  if (g && n) out.push(g.id);
  out.push(...mine.words.filter(id => !cards[id]).slice(0, n - out.length));
  const rest = n - out.length;
  const kana = KANA.map(k => k.id).filter(id => !cards[id]);
  const ws = words.filter(w => !cards[w.id] && !mine.words.includes(w.id) && eligible(w, cards)).map(w => w.id);
  const k = Math.min(kana.length, Math.max(Math.ceil(rest / 2), rest - ws.length));
  return [...out, ...kana.slice(0, k), ...ws.slice(0, rest - k)];
}

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
