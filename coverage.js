// Coverage of what's known (fractions 0-1) and the milestones that fire as it grows.
import { isKnown } from './srs.js';
import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { readable } from './sentences.js';

export function coverage(cards, words, sentences) {
  const known = id => !!cards[id] && isKnown(cards[id]);
  const share = list => list.length ? list.filter(x => known(x.id)).length / list.length : 0;
  const lvl = j => share(words.filter(w => w.j === j));
  // ponytail: scans every sentence per call; cache per render if it gets slow
  return { hira: share(KANA.filter(k => k.script === 'hira')), kata: share(KANA.filter(k => k.script === 'kata')),
    n5: lvl(5), n4: lvl(4), grammar: share(GRAMMAR),
    library: sentences.length ? sentences.filter(s => readable(s, known)).length / sentences.length : 0 };
}

const pct = (key, label, ps) => ps.map(p => ({ id: `${key}${p}`, label: label ? `${label} ${p}% known` : `You can now read ${p}% of Gengo's sentences`, hit: c => c[key] >= p / 100 }));
export const MILESTONES = [
  { id: 'hira', label: 'All hiragana known', hit: c => c.hira >= 1 },
  { id: 'kata', label: 'All katakana known', hit: c => c.kata >= 1 },
  ...pct('n5', 'N5 words', [25, 50, 75, 100]),
  ...pct('n4', 'N4 words', [25, 50, 75, 100]),
  { id: 'grammar', label: 'All 15 grammar points known', hit: c => c.grammar >= 1 },
  ...pct('library', '', [10, 25, 50, 75]),
];
export const fresh = (cov, seen) => MILESTONES.filter(m => m.hit(cov) && !seen.includes(m.id));
