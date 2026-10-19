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
export function grammarReady(cards, mine = {}) {
  const pulled = (mine.grammar ?? []).find(id => !cards[id]);
  if (pulled) return GRAMMAR.find(g => g.id === pulled) ?? null;
  const i = GRAMMAR.findIndex(g => !cards[g.id]);
  if (i < 0 || (i && !cards[GRAMMAR[i - 1].id])) return null;
  const n = Object.keys(cards).filter(id => /^[wc]-/.test(id) && item(id)).length; // only words that exist: a junk backup can't unlock grammar
  return n >= GRAMMAR[i].words ? GRAMMAR[i] : null;
}

// Kanji ids not yet carded that appear in a word you are learning, in kanji.json order (N5 first, most frequent first).
export function kanjiReady(cards, kanji) {
  const seen = new Set(Object.keys(cards).filter(id => /^[wc]-/.test(id)).flatMap(id => [...(item(id)?.w ?? '')]));
  return kanji.filter(k => !cards[k.id] && seen.has(k.k)).map(k => k.id);
}

// Up to n new ids: one grammar point first, then personal words, then up to a quarter kanji, then half kana / half words, either side filling the other.
export function nextNew(cards, n, { words = [], mine = {}, kanji = [] } = {}) {
  const out = [], g = grammarReady(cards, mine), mw = (mine.words ?? []).filter(id => item(id));
  if (g && n) out.push(g.id);
  out.push(...mw.filter(id => !cards[id]).slice(0, n - out.length));
  out.push(...kanjiReady(cards, kanji).slice(0, Math.min(n - out.length, Math.ceil(n / 4))));
  const rest = n - out.length;
  const kana = KANA.map(k => k.id).filter(id => !cards[id]);
  const ws = [];
  for (const w of words) { if (ws.length >= rest) break; if (!cards[w.id] && !mw.includes(w.id) && eligible(w, cards)) ws.push(w.id); } // stop at `rest`: no need to scan all words
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
