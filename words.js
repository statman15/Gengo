// Word data: loader, kana-unlock check, search, multiple-choice distractors.
import { KANA } from './kana.js';

export const loadWords = async (fetchFn = fetch) => {
  try { const r = await fetchFn('data/words.json'); return r.ok ? await r.json() : []; } catch { return []; }
};

const byKana = Object.fromEntries(KANA.map(k => [k.kana, k.id]));
// small kana -> full size, ヴ -> ウ, ー dropped
const FOLD = { ゎ: 'わ', ヮ: 'ワ', ヴ: 'ウ' };
export const kanaIds = reading => [...new Set([...reading].map(c => {
  if (c === 'ー') return null;
  c = FOLD[c] || c;
  const i = 'ぁぃぅぇぉっゃゅょ'.indexOf(c), j = 'ァィゥェォッャュョ'.indexOf(c);
  return byKana['あいうえおつやゆよ'[i]] || byKana['アイウエオツヤユヨ'[j]] || byKana[c] || null;
}).filter(Boolean))];

export const eligible = (word, cards) => kanaIds(word.r).every(id => cards[id]);

const norm = s => ` ${s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
export function search(words, q) {
  q = q.trim();
  if (!q) return [];
  const n = norm(q), seen = new Set(), out = [];
  const pass = test => { for (const x of words) if (out.length < 20 && !seen.has(x) && test(x)) { seen.add(x); out.push(x); } };
  pass(x => x.w === q || x.r === q);
  pass(x => x.w.startsWith(q) || x.r.startsWith(q));
  if (n.trim()) pass(x => x.m.some(g => norm(g).includes(n)));
  return out;
}

export function meaningChoices(word, pool, rand) {
  const i = Math.max(0, pool.indexOf(word)), first = new Set([word.m[0]]);
  const near = pool.slice(Math.max(0, i - 150), i + 151).filter(x => x !== word && x.p === word.p);
  for (let k = near.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [near[k], near[j]] = [near[j], near[k]]; }
  const out = [word];
  for (const x of near) if (out.length < 4 && !first.has(x.m[0])) { first.add(x.m[0]); out.push(x); }
  for (let k = out.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [out[k], out[j]] = [out[j], out[k]]; }
  return out;
}
