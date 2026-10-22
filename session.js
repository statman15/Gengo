import { isDue } from './srs.js';
import { KANA, LOOK } from './kana.js';
import { LEARN, BASIC } from './rules.js';
import { PHRASES, said } from './phrases.js';
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
// None until both basic kana sets are carded: kanji wait until you can write their readings.
export function kanjiReady(cards, kanji) {
  if (!BASIC.every(id => cards[id])) return [];
  const seen = new Set(Object.keys(cards).filter(id => /^[wc]-/.test(id)).flatMap(id => [...(item(id)?.w ?? '')]));
  return kanji.filter(k => !cards[k.id] && seen.has(k.k)).map(k => k.id);
}

// Words a phrase card already teaches (はい, ありがとう…): skipped so they aren't learned twice.
const SAID = new Set(PHRASES.map(p => said(p.r)));

// Up to n new ids: one grammar point first, then personal words, then up to a quarter kanji (at least one), then a phrase or two
// (learned by ear, so they start on day one), then half kana (and at most one spelling rule) / half words, either side filling the other.
export function nextNew(cards, n, { words = [], mine = {}, kanji = [] } = {}) {
  const out = [], g = grammarReady(cards, mine), mw = (mine.words ?? []).filter(id => item(id));
  if (g && n) out.push(g.id);
  out.push(...mw.filter(id => !cards[id]).slice(0, n - out.length));
  out.push(...kanjiReady(cards, kanji).slice(0, Math.min(n - out.length, Math.max(1, Math.floor(n / 4))))); // a quarter, rounded down: words stay the bulk
  const have = new Set(Object.keys(cards).map(item).filter(x => x?.kind === 'word').map(x => x.r)); // a word card already teaches it (learned before phrases existed)
  out.push(...PHRASES.filter(p => !cards[p.id] && !have.has(said(p.r))).slice(0, Math.min(n - out.length, Math.max(1, Math.round(n / 5)))).map(p => p.id));
  const rest = n - out.length;
  const left = LEARN.filter(id => !cards[id]), second = left.findIndex((id, i) => id.startsWith('r-') && left.slice(0, i).some(x => x.startsWith('r-')));
  const kana = second < 0 ? left : left.slice(0, second); // one rule lesson per batch, and nothing past the next rule until it is learned
  const ws = [];
  for (const w of words) { if (ws.length >= rest) break; if (!cards[w.id] && !mw.includes(w.id) && !SAID.has(w.r) && eligible(w, cards)) ws.push(w.id); } // stop at `rest`: no need to scan all words
  const k = Math.min(kana.length, Math.max(Math.ceil(rest / 2), rest - ws.length));
  return [...out, ...kana.slice(0, k), ...ws.slice(0, rest - k)];
}

const shuffle = (a, rand) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// 4 distinct items of item's script (distinct sounds too, so romaji choices never repeat), shuffled.
// With has(id) (is it carded?), wrong answers come from kana you have, up to two look-alikes of item first.
export function choices(item, pool, rand, has) {
  const seen = new Set([item.sound]), others = [];
  const look = new Set(LOOK.filter(g => g.includes(item.kana)).join(''));
  const rank = x => !has ? 0 : look.has(x.kana) && has(x.id) ? 0 : has(x.id) ? 1 : /^[gzdbpj]/.test(x.sound) ? 3 : 2; // unlearned ゛゜ kana last
  let looks = 0;
  for (const x of shuffle(pool.filter(x => x.script === item.script), rand).sort((a, b) => rank(a) - rank(b)))
    if (others.length < 3 && !seen.has(x.sound) && (rank(x) || !has || looks++ < 2)) { seen.add(x.sound); others.push(x); }
  return shuffle([item, ...others], rand);
}
