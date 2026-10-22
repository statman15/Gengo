import { isDue } from './srs.js';
import { KANA, LOOK } from './kana.js';
import { LEARN, BASIC } from './rules.js';
import { PHRASES, said } from './phrases.js';
import { trackOf } from './tracks.js';
import { GRAMMAR } from './grammar.js';
import { eligible } from './words.js';
import { item } from './items.js';

// Due card ids, most overdue first.
export const dueQueue = (cards, now) =>
  Object.keys(cards).filter(id => item(id) && isDue(cards[id], now)).sort((a, b) => new Date(cards[a].due) - new Date(cards[b].due));

// Cards that fall due within the next day: tomorrow's review load.
export const dueSoon = (cards, now) => Object.keys(cards).filter(id => item(id) && new Date(cards[id].due) <= new Date(+now + 864e5)).length;

// Up to n cards to practise when new items are paused: those reviewed in the last day first, then the rest, weakest first.
export function practiceQueue(cards, now, n = 10) {
  const recent = id => !!cards[id].last_review && +now - new Date(cards[id].last_review) < 864e5;
  return Object.keys(cards).filter(id => item(id)).sort((a, b) => recent(b) - recent(a) || cards[a].stability - cards[b].stability).slice(0, n);
}

// The next grammar point to offer: a pulled-forward one, else (unless auto is off, as on the Travel track) the first
// uncarded point once the one before it has a card and enough words (w- and c-) have cards.
export function grammarReady(cards, mine = {}, auto = true) {
  const pulled = (mine.grammar ?? []).find(id => !cards[id]);
  if (pulled) return GRAMMAR.find(g => g.id === pulled) ?? null;
  if (!auto) return null;
  const i = GRAMMAR.findIndex(g => !cards[g.id]);
  if (i < 0 || (i && !cards[GRAMMAR[i - 1].id])) return null;
  const n = Object.keys(cards).filter(id => /^[wc]-/.test(id) && item(id)).length; // only words that exist: a junk backup can't unlock grammar
  return n >= GRAMMAR[i].words ? GRAMMAR[i] : null;
}

// Kanji ids not yet carded that appear in a word you are learning, in kanji.json order (N5 first, most frequent first).
// None until both basic kana sets are carded: kanji wait until you can write their readings. mode: 'full' (all),
// 'light' (N5 kanji only, Conversation) or 'none' (Travel: signs are learned as words).
export function kanjiReady(cards, kanji, mode = 'full') {
  if (mode === 'none' || !BASIC.every(id => cards[id])) return [];
  if (mode === 'light') kanji = kanji.filter(k => k.j === 5);
  const seen = new Set(Object.keys(cards).filter(id => /^[wc]-/.test(id)).flatMap(id => [...(item(id)?.w ?? '')]));
  return kanji.filter(k => !cards[k.id] && seen.has(k.k)).map(k => k.id);
}

// Words a phrase card already teaches (はい, ありがとう…): skipped so they aren't learned twice.
const SAID = new Set(PHRASES.map(p => said(p.r)));

// Up to n new ids: one grammar point first, then personal words, then up to a quarter kanji (at least one), then three quarters kana
// (at most one spelling rule), a phrase or two (learned by ear, so they start on day one), then words, either side filling the other.
// track: a TRACKS entry (tracks.js); words should already be in that track's order (wordOrder).
export function nextNew(cards, n, { words = [], mine = {}, kanji = [], track = trackOf() } = {}) {
  const out = [], g = grammarReady(cards, mine, track.grammar), mw = (mine.words ?? []).filter(id => item(id));
  if (g && n) out.push(g.id);
  out.push(...mw.filter(id => !cards[id]).slice(0, n - out.length));
  const kn = track.kanji === 'light' ? 1 : Math.max(1, Math.floor(n / 4)); // a quarter, rounded down (one on Conversation): words stay the bulk
  out.push(...kanjiReady(cards, kanji, track.kanji).slice(0, Math.min(n - out.length, kn)));
  const kanaLeft = LEARN.some(id => !cards[id]);
  const have = new Set(Object.keys(cards).map(item).filter(x => x?.kind === 'word').map(x => x.r)); // a word card already teaches it (learned before phrases existed)
  const phrases = PHRASES.filter(p => !cards[p.id] && !have.has(said(p.r))).slice(0, kanaLeft ? 1 : Math.max(1, Math.round(n * track.phrases / 5))).map(p => p.id); // one a batch while kana remain
  const left = LEARN.filter(id => !cards[id]), second = left.findIndex((id, i) => id.startsWith('r-') && left.slice(0, i).some(x => x.startsWith('r-')));
  const kana = second < 0 ? left : left.slice(0, second); // one rule lesson per batch, and nothing past the next rule until it is learned
  // Kana take three quarters of what's left, then the phrase(s), then words. While kana remain, words only fill gaps.
  const room = n - out.length, ph = phrases.slice(0, room), k0 = Math.min(kana.length, Math.ceil(room * 3 / 4), room - ph.length);
  const rest = room - ph.length;
  const ws = [];
  for (const w of words) { if (ws.length >= rest) break; if (!cards[w.id] && !mw.includes(w.id) && !SAID.has(w.r) && eligible(w, cards)) ws.push(w.id); } // stop at `rest`: no need to scan all words
  const k = Math.min(kana.length, Math.max(k0, rest - ws.length)); // kana first: both sets in about 3 weeks
  return [...out, ...ph, ...kana.slice(0, k), ...ws.slice(0, rest - k)];
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
