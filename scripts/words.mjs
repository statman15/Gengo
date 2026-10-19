// Builds data/words.json: JMdict common words in learning order (JLPT N5..N1, then the rest).
// Run by hand: node scripts/words.mjs [cacheDir]. Downloads are cached in cacheDir (default: OS temp);
// pre-fetch with `curl -L --retry 5 -C -` into it as jmdict.tgz and n5.csv..n1.csv if fetch gets truncated.
import { gunzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isGrammar } from './grammar-parts.mjs';

const cache = process.argv[2] || join(tmpdir(), 'gengo-words');
mkdirSync(cache, { recursive: true });
const get = async (name, url) => {
  const f = join(cache, name);
  if (!existsSync(f)) { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  return readFileSync(f);
};

// minimal tar reader: first regular file
function untar(buf) {
  for (let o = 0; o + 512 <= buf.length;) {
    const size = parseInt(buf.toString('latin1', o + 124, o + 135).trim() || '0', 8), type = String.fromCharCode(buf[o + 156] || 48);
    if (type === '0') return buf.subarray(o + 512, o + 512 + size);
    o += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error('no file in tgz');
}

// CSV with quoted fields
function csv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) rows.push([...row, f]);
  return rows.slice(1);
}

const rel = await fetch('https://api.github.com/repos/scriptin/jmdict-simplified/releases/latest').then(r => r.json());
const asset = rel.assets.find(a => /^jmdict-eng-common-.*\.json\.tgz$/.test(a.name));
const dict = JSON.parse(untar(gunzipSync(await get('jmdict.tgz', asset.browser_download_url))).toString('utf8'));
console.log('JMdict', dict.version, dict.words.length, 'entries');

// JLPT: each CSV row tags ONE entry: kanji+reading match first, then a kana-only expression
// (only entries with no kanji form or a sense-1 `uk` tag), then the lowest entry id. Easiest level wins.
const jlpt = new Map(); // entry id -> level
const byKana = new Map();
for (const e of dict.words) for (const k of e.kana) byKana.set(k.text, [...(byKana.get(k.text) || []), e]);
const isKana = s => /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(s);
for (const n of [5, 4, 3, 2, 1]) {
  const rows = csv((await get(`n${n}.csv`, `https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/n${n}.csv`)).toString('utf8'));
  console.log('N' + n, rows.length, 'rows');
  for (const [e, r] of rows) {
    let best, rank = 9;
    for (const x of e.split(/\s*;\s*/)) for (const y of r.split(/\s*;\s*/)) for (const c of byKana.get(y) || []) {
      const rk = c.kanji.some(k => k.text === x) ? 0
        : isKana(x) && c.kana.some(k => k.text === x) && (!c.kanji.length || c.sense[0].misc.includes('uk')) ? 1 : 9;
      if (rk < 9 && (rk < rank || (rk === rank && +c.id < +best.id))) [best, rank] = [c, rk];
    }
    if (best && !jlpt.has(best.id)) jlpt.set(best.id, n);
  }
}

const out = [];
for (const e of dict.words) {
  const s = e.sense[0], f = s?.partOfSpeech[0] || '';
  if (!s || isGrammar(e)) continue;
  const wk = e.kanji.find(k => k.common), w = wk?.text || '';
  const rk = e.kana.find(k => k.common && (!w || k.appliesToKanji.includes('*') || k.appliesToKanji.includes(w))) || e.kana.find(k => k.common) || e.kana[0];
  out.push({
    id: 'w-' + e.id, r: rk.text, w: s.misc.includes('uk') ? '' : w, // usually-kana words don't show their rare kanji
    m: e.sense.slice(0, 2).map(x => x.gloss.slice(0, 3).map(g => g.text)).flat(),
    p: /^v/.test(f) ? 'v' : /^adj-(i|ix|na)$/.test(f) ? 'adj' : /^n($|-)/.test(f) ? 'n' : 'x',
    f, j: jlpt.get(e.id) || 0,
  });
}
// ponytail: JMdict-simplified drops the nfXX/news1/ichi1 tags, so within a level words used most in our Tatoeba sentences
// (data/sentences.json from the last build) come first, then shorter readings, then entry id. A real corpus count would be better.
const uses = {};
if (existsSync('data/sentences.json')) for (const s of JSON.parse(readFileSync('data/sentences.json', 'utf8'))) for (const [, , id] of s.t) uses[id] = (uses[id] || 0) + 1;
out.sort((a, b) => (b.j || -1) - (a.j || -1) || (uses[b.id] || 0) - (uses[a.id] || 0) || a.r.length - b.r.length || +a.id.slice(2) - +b.id.slice(2));
// 2.5 MB cap (globals): drop the tail of non-JLPT entries until it fits.
for (let size = Buffer.byteLength(JSON.stringify(out)); size > 2.45e6; out.pop()) size -= Buffer.byteLength(JSON.stringify(out.at(-1))) + 1;
mkdirSync('data', { recursive: true });
writeFileSync('data/words.json', JSON.stringify(out));
const c = [0, 1, 2, 3, 4, 5].map(j => out.filter(x => x.j === j).length);
console.log(out.length, 'words; per level 0..5:', c.join(' '));
