// Re-tags data/sentences.json with grammar points added since the last full build, offline (no Tatoeba download).
// Run by hand after adding points to grammar.js: node scripts/grammar-tags.mjs. Points already tagged keep their tags
// (the full build in sentences.mjs saw each token's dictionary head and part of speech); new points are matched on
// tokens rebuilt from the file: surface, reading, and for words their head and part of speech from data/words.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { GRAMMAR } from '../grammar.js';

const data = JSON.parse(readFileSync('data/sentences.json', 'utf8'));
const words = new Map(JSON.parse(readFileSync('data/words.json', 'utf8')).map(w => [w.id, w]));
const tagged = new Set(data.flatMap(s => s.g)), fresh = GRAMMAR.filter(p => !tagged.has(p.id));
// Where the tokens can't tell (〜られる is potential or passive; 〜にする is "decide on" or "make into"), the English decides.
const EN = {
  'g-pot': /\b(can|could|able|possible|manage)/i,
  'g-pass': /\b(was|were|been|being|be|is|are|got|get|gets|had)\b (\w+ )?\w+(ed|en|wn|lt|ht|ck|ng)\b|\b(had|have|has|got) (my|his|her|their|our|your) /i,
  'g-ni-suru': /\b(i'll have|i will have|decide|chose|choose|would you like|i'll take|i will take)/i,
};
// Like the full build, a point keeps its 60 shortest sentences (drills want short ones, and the file stays under 3 MB).
const hits = new Map(fresh.map(p => [p.id, []]));
for (const s of data) {
  const tok = s.t.map(([sf, r, id]) => { const w = words.get(id); return w ? { s: sf, r, h: w.w || w.r, f: w.f } : { s: sf, r, h: sf, f: '' }; });
  for (const p of fresh) if (p.match(tok) && (!EN[p.id] || EN[p.id].test(s.en))) hits.get(p.id).push(s);
}
const len = s => s.t.map(t => t[0]).join('').length;
for (const [id, list] of hits) for (const s of list.sort((a, b) => len(a) - len(b)).slice(0, 60)) s.g.push(id);
writeFileSync('data/sentences.json', JSON.stringify(data));
console.log(fresh.length, 'new points tagged:', fresh.map(p => p.id + '=' + data.filter(s => s.g.includes(p.id)).length).join(' '));
