// Builds data/sentences.json: Tatoeba sentences with word/grammar-tagged tokens, matched to data/words.json.
// Run by hand: node scripts/sentences.mjs [cacheDir]. Downloads are cached in cacheDir (default: OS temp);
// pre-fetch with `curl -L --retry 5 -C -` into it if fetch gets truncated. jmdict.tgz is the file scripts/words.mjs caches.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GRAMMAR } from '../grammar.js';
import { isGrammar } from './grammar-parts.mjs';
import { tokenReading } from '../sentences.js';

const cache = process.argv[2] || join(tmpdir(), 'gengo-sentences');
mkdirSync(cache, { recursive: true });
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: cache, maxBuffer: 1 << 30 });
const get = (name, url) => {
  if (existsSync(join(cache, name))) return;
  sh('curl', ['-sSL', '--retry', '5', '-C', '-', '-o', name + '.part', url]);
  renameSync(join(cache, name + '.part'), join(cache, name));
};
const B = 'https://downloads.tatoeba.org/exports';
get('jpn_indices.tar.bz2', B + '/jpn_indices.tar.bz2');
get('jpn_sentences.tsv.bz2', B + '/per_language/jpn/jpn_sentences.tsv.bz2');
get('eng_sentences.tsv.bz2', B + '/per_language/eng/eng_sentences.tsv.bz2');
if (!existsSync(join(cache, 'jpn_indices.csv'))) sh('tar', ['-xjf', 'jpn_indices.tar.bz2']);
for (const f of ['jpn_sentences', 'eng_sentences']) if (!existsSync(join(cache, f + '.tsv'))) sh('bzip2', ['-dk', f + '.tsv.bz2']);
if (!existsSync(join(cache, 'jmdict.tgz'))) {
  const rel = await fetch('https://api.github.com/repos/scriptin/jmdict-simplified/releases/latest').then(r => r.json());
  get('jmdict.tgz', rel.assets.find(a => /^jmdict-eng-common-.*\.json\.tgz$/.test(a.name)).browser_download_url);
}
const read = f => readFileSync(join(cache, f), 'utf8');

// grammar tokens: heads whose JMdict sense-1 pos is particle/copula/auxiliary
const dict = JSON.parse(sh('tar', ['-xzOf', 'jmdict.tgz']).toString('utf8'));
const gram = new Map(); // head text or '#entryId' -> pos
for (const e of dict.words) {
  const f = e.sense[0]?.partOfSpeech[0] || '';
  if (!isGrammar(e)) continue;
  gram.set('#' + e.id, f);
  for (const k of [...e.kanji, ...e.kana]) if (!gram.has(k.text)) gram.set(k.text, f);
}
const words = JSON.parse(readFileSync('data/words.json', 'utf8'));
const order = new Map(words.map((w, i) => [w.id, i])), byHead = new Map();
const isKana = s => /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(s);
// every written form of every kept entry resolves to it (the word's own `w` is only the common form), best word first
const entries = new Map(dict.words.map(e => [e.id, e]));
for (const w of words) for (const k of [...entries.get(w.id.slice(2)).kanji.map(k => k.text), ...entries.get(w.id.slice(2)).kana.map(k => k.text)]) byHead.set(k, [...(byHead.get(k) || []), w]);

// ponytail: first words.json match wins; no sense disambiguation (the [nn] index is ignored).
// A bare kana head that JMdict calls a particle/auxiliary is grammar first (と is also 戸, か also 蚊).
function resolve(head, reading) {
  if (reading?.[0] === '#') { const w = words[order.get('w-' + reading.slice(1))]; return w ? found(w, head) : gram.has(reading) ? { gram: gram.get(reading) } : null; } // (#entryId) pins the JMdict entry
  if (!reading && isKana(head) && gram.has(head)) return { gram: gram.get(head) };
  const w = (byHead.get(head) || []).find(x => !reading || entries.get(x.id.slice(2)).kana.some(k => k.text === reading));
  return w ? found(w, head, reading) : gram.has(head) ? { gram: gram.get(head) } : null;
}
// the head as written plus its kana reading (the index's, else the first kana that applies to this written form)
function found(w, head, reading) {
  const e = entries.get(w.id.slice(2));
  return { w, head, hr: reading?.[0] !== '#' && reading || (e.kana.find(k => k.appliesToKanji.includes('*') || k.appliesToKanji.includes(head)) || e.kana[0]).text };
}

const column = (f, col) => { const m = new Map(); for (const l of read(f).split('\n')) { const c = l.split('\t'); if (c[col]) m.set(c[0], c[col].trim()); } return m; };
const eng = column('eng_sentences.tsv', 2), jpn = column('jpn_sentences.tsv', 2);

const PUNCT = /^[\s。、，．！？!?…「」『』（）()・：:；;〜～"'“”‘’]*$/u;
const drops = {}, out = [], seen = new Set();
const drop = r => { drops[r] = (drops[r] || 0) + 1; };
for (const row of read('jpn_indices.csv').split('\n')) {
  const [jid, eid, idx] = row.split('\t'), text = jpn.get(jid), en = eng.get(eid);
  if (!text || !idx || seen.has(jid)) continue;
  seen.add(jid);
  const toks = idx.trim().split(/\s+/);
  if (!en) { drop('no english'); continue; }
  if ([...text].length > 25) { drop('long'); continue; }
  if (toks.length > 10) { drop('tokens'); continue; }
  const t = [], tok = []; let pos = 0, bad;
  const punct = (a, b) => { for (const c of text.slice(a, b)) if (!/\s/.test(c)) t.push([c, '', '.']); };
  for (const x of toks) {
    const [, head, reading, surf] = x.match(/^(.+?)(?:\((.+?)\))?(?:\[\d+\])?(?:\{(.+?)\})?~?$/), surface = surf || head;
    const r = resolve(head, reading), at = text.indexOf(surface, pos);
    if (!r) { bad = 'unresolved'; break; }
    if (at < 0 || !PUNCT.test(text.slice(pos, at))) { bad = 'align'; break; }
    const rd = r.w ? tokenReading(surface, r.head, r.hr) : isKana(surface) ? surface : null;
    if (rd === null) { bad = 'reading'; break; }
    punct(pos, at);
    t.push([surface, rd, r.w ? r.w.id : '']);
    tok.push({ h: head, s: surface, f: r.w ? r.w.f : r.gram });
    pos = at + surface.length;
  }
  if (!bad && !PUNCT.test(text.slice(pos))) bad = 'align';
  if (bad) { drop(bad); continue; }
  punct(pos, text.length);
  out.push({ en, t, g: GRAMMAR.filter(p => p.match(tok)).map(p => p.id), len: [...text].length });
}
console.log(out.length, 'usable sentences; dropped', drops);

// 3 shortest per word, 60 shortest per grammar point; the union
out.sort((a, b) => a.len - b.len);
const keep = new Set(), n = {}, per = {};
for (const s of out) for (const [, , id] of s.t) if (id[0] === 'w' && (n[id] = (n[id] || 0) + 1) <= 3) keep.add(s);
for (const s of out) for (const g of s.g) if ((per[g] = (per[g] || 0) + 1) <= 60) keep.add(s);
let res = out.filter(s => keep.has(s));

// 3 MB cap: grammar-point picks are protected, the rest go latest-learned-word first
const size = a => Buffer.byteLength(JSON.stringify(a));
const slim = ({ en, t, g }) => ({ en, t, g });
if (size(res.map(slim)) > 2.9e6) {
  const gp = new Set(), c = {};
  for (const s of out) for (const g of s.g) if ((c[g] = (c[g] || 0) + 1) <= 60) gp.add(s);
  const rank = s => Math.min(...s.t.filter(x => x[2][0] === 'w').map(x => order.get(x[2])));
  const rest = res.filter(s => !gp.has(s)).sort((a, b) => rank(b) - rank(a));
  let total = size(res.map(slim));
  const cut = new Set();
  for (const s of rest) { if (total <= 2.9e6) break; total -= Buffer.byteLength(JSON.stringify(slim(s))) + 1; cut.add(s); }
  res = res.filter(s => !cut.has(s));
}
const json = JSON.stringify(res.map(slim));
mkdirSync('data', { recursive: true });
writeFileSync('data/sentences.json', json);
console.log(res.length, 'sentences,', Buffer.byteLength(json), 'bytes');
console.log('per point:', GRAMMAR.map(g => g.id + '=' + res.filter(s => s.g.includes(g.id)).length).join(' '));
