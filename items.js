// One lookup for every card id: kana, shipped word, custom word, grammar point. Plus each item's ladder.
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { loadWords } from './words.js';
import { TUNING } from './srs.js';
import { db } from './store.js';

const byId = new Map([...KANA.map(k => [k.id, { ...k, kind: 'kana' }]), ...GRAMMAR.map(g => [g.id, { ...g, kind: 'grammar' }])]);
let words = [], loading;

// Loads data/words.json once. Never rejects: offline leaves words empty and kana still work.
export const ready = fetchFn => loading ??= loadWords(fetchFn).then(ws => {
  words = Array.isArray(ws) ? ws : [];
  for (const w of words) byId.set(w.id, { ...w, kind: 'word' });
}, () => {});

export const loadedWords = () => words;

export const item = id => byId.get(id) ?? (Object.hasOwn(db.custom, id) ? { id, kind: 'word', custom: true, ...db.custom[id] } : null);

export const ladderFor = it => it.kind === 'grammar' ? TUNING.ladder.grammar.filter(([r]) => it.acts.includes(r)) : TUNING.ladder[it.kind];
