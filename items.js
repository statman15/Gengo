// One lookup for every card id: kana, spelling rule, phrase, shipped word, custom word, grammar point, kanji. Plus each item's ladder.
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { RULES } from './rules.js';
import { PHRASES } from './phrases.js';
import { loadWords } from './words.js';
import { TUNING } from './srs.js';
import { db } from './store.js';
import { trackOf } from './tracks.js';
import { GLOSS } from './travel.js';

const byId = new Map([...KANA.map(k => [k.id, { ...k, kind: 'kana' }]), ...GRAMMAR.map(g => [g.id, { ...g, kind: 'grammar' }]),
  ...RULES.map(r => [r.id, { ...r, kind: 'rule' }]), ...PHRASES.map(p => [p.id, { ...p, kind: 'phrase' }])]);
let words = [], kanji = [], loading;
const loadKanji = async (fetchFn = fetch) => { try { const r = await fetchFn('data/kanji.json'); return r.ok ? await r.json() : []; } catch { return []; } };

// Loads data/words.json and data/kanji.json once. Never rejects: offline leaves them empty and kana still work.
export const ready = fetchFn => loading ??= Promise.all([loadWords(fetchFn), loadKanji(fetchFn)]).then(([ws, ks]) => {
  words = Array.isArray(ws) ? ws : [];
  kanji = Array.isArray(ks) ? ks : [];
  for (const w of words) { if (GLOSS[w.id]) w.m = [GLOSS[w.id], ...w.m.filter(g => g !== GLOSS[w.id])]; byId.set(w.id, { ...w, kind: 'word' }); }
  for (const k of kanji) byId.set(k.id, { ...k, kind: 'kanji' });
}, () => {});

export const loadedWords = () => words;
export const loadedKanji = () => kanji;

export const item = id => byId.get(id) ?? (Object.hasOwn(db.custom, id) ? { id, kind: 'word', custom: true, ...db.custom[id] } : null);

// The track bends two ladders: only Whole language traces kanji, and Conversation reaches speaking at half the stability.
export function ladderFor(it) {
  const t = trackOf(db.settings.track);
  if (it.kind === 'grammar') return TUNING.ladder.grammar.filter(([r]) => r === 'translate' || it.acts.includes(r));
  if (it.kind === 'rule') return TUNING.ladder.rule.filter(([r]) => it.acts.includes(r));
  if (it.kind === 'kanji' && t.kanji !== 'full') return TUNING.ladder.kanji.filter(([r]) => r !== 'trace');
  if (t.sayEarly && (it.kind === 'word' || it.kind === 'phrase')) return TUNING.ladder[it.kind].map(([r, s]) => [r, r === 'say' ? s / 2 : s]);
  return TUNING.ladder[it.kind];
}
