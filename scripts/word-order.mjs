// Reorders data/words.json by real word frequency, from wordfreq's Japanese list (Robyn Speer et al., CC BY-SA 4.0:
// subtitles, Wikipedia, news, web text and social media, split into words by MeCab). Run by hand after scripts/words.mjs:
//   node scripts/word-order.mjs [cacheDir]
// The starter words stay first and JLPT levels stay in order (N5, N4, … then the rest); inside a level, most frequent first.
// MeCab splits inflected words (食べ|ます, 飲ん|だ), so a verb's or adjective's frequency is the sum over its dictionary
// form and its stems, and a word's kana spelling counts when it is long enough not to collide with other words.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { conjugate } from '../conjugate.js';

const cache = process.argv[2] || join(tmpdir(), 'gengo-wordfreq'), file = join(cache, 'large_ja.msgpack.gz');
mkdirSync(cache, { recursive: true });
if (!existsSync(file)) execFileSync('curl', ['-sSL', '--retry', '5', '-o', file, 'https://raw.githubusercontent.com/rspeer/wordfreq/master/wordfreq/data/large_ja.msgpack.gz']);

// Minimal msgpack reader (wordfreq's cBpack: a header, then bucket i = the words at -i centibels).
function decode(buf) {
  let o = 0;
  const u8 = () => buf[o++], u16 = () => (o += 2, buf.readUInt16BE(o - 2)), u32 = () => (o += 4, buf.readUInt32BE(o - 4));
  const str = n => (o += n, buf.toString('utf8', o - n, o)), arr = n => Array.from({ length: n }, val);
  const map = n => Object.fromEntries(Array.from({ length: n }, () => [val(), val()]));
  function val() {
    const b = u8();
    if (b <= 0x7f) return b; if (b >= 0xe0) return b - 256;
    if ((b & 0xf0) === 0x80) return map(b & 0x0f); if ((b & 0xf0) === 0x90) return arr(b & 0x0f); if ((b & 0xe0) === 0xa0) return str(b & 0x1f);
    switch (b) {
      case 0xc0: return null; case 0xc2: return false; case 0xc3: return true;
      case 0xcc: return u8(); case 0xcd: return u16(); case 0xce: return u32();
      case 0xd9: return str(u8()); case 0xda: return str(u16()); case 0xdb: return str(u32());
      case 0xdc: return arr(u16()); case 0xdd: return arr(u32()); case 0xde: return map(u16()); case 0xdf: return map(u32());
      default: throw new Error(`msgpack type 0x${b.toString(16)} at ${o - 1}`);
    }
  }
  return val();
}
const packed = decode(gunzipSync(readFileSync(file)));
if (packed[0]?.format !== 'cB') throw new Error('not a wordfreq cBpack file');
const freq = new Map();
packed.slice(1).forEach((bucket, cB) => { for (const w of bucket) freq.set(w, 10 ** (-cB / 100)); });

const HAN = /\p{Script=Han}/u;
const ok = s => !!s && (HAN.test(s) || [...s].length >= 3); // short kana forms (い, し, かい) collide with other words
const readings = new Map();
function forms(w) {
  const base = w.w || w.r, out = new Set([base]);
  if (w.w && w.r.length >= 3 && readings.get(w.r) === 1) out.add(w.r); // only a reading no other word shares (暮れる ≠ くれる)
  if (/^v/.test(w.f)) for (const f of ['masu', 'nai', 'te']) {
    const c = conjugate(base, w.f, f), stem = c && c.replace(/(ます|ない|て|で)$/, '');
    if (ok(stem)) out.add(stem);
  }
  if (/^adj-i/.test(w.f) && base.endsWith('い')) for (const end of ['く', 'かっ', 'けれ']) if (ok(base.slice(0, -1) + end)) out.add(base.slice(0, -1) + end);
  return out;
}
// A compound MeCab splits (お|兄|さん, 誕生|日) is scored by its rarest part, halved: greedy longest pieces found in the list.
function parts(s) {
  const out = [];
  for (let i = 0; i < s.length;) { let j = s.length; while (j > i + 1 && !freq.has(s.slice(i, j))) j--; if (!freq.has(s.slice(i, j))) return null; out.push(s.slice(i, j)); i = j; }
  return out.length > 1 ? out : null;
}
const score = w => [...forms(w)].reduce((s, f) => s + (freq.get(f) ?? 0), 0) || (p => p ? Math.min(...p.map(x => freq.get(x))) / 2 : 0)(parts(w.w || w.r));

const words = JSON.parse(readFileSync('data/words.json', 'utf8'));
for (const w of words) readings.set(w.r, (readings.get(w.r) ?? 0) + 1);
// Polite starters first, as in words.mjs (they're rarer in written text than in a traveller's first week).
const STARTER = ['w-1010080', 'w-1583250', 'w-1289400', 'w-1586820', 'w-1295060', 'w-1612820', 'w-1289480', 'w-1291050', 'w-1001720', 'w-1189130', 'w-1625780', 'w-1410800'];
const first = id => STARTER.indexOf(id) + 1 || 99, level = j => j ? 6 - j : 9; // N5 = 1 … N1 = 5, no level last
const sc = new Map(words.map(w => [w.id, score(w)])), was = new Map(words.map((w, i) => [w.id, i]));
// Words wordfreq can't score (MeCab splits お兄さん into お|兄|さん, dates like ２日 into parts) keep the place they had in
// their level, as a share of it, rather than sinking to the end: the scored words fill the other places in frequency order.
const groups = new Map();
for (const w of words) { const k = first(w.id) < 99 ? 'starter' : level(w.j); groups.set(k, [...(groups.get(k) ?? []), w]); }
const out = [];
for (const k of [...groups.keys()].sort((a, b) => (a === 'starter' ? -1 : b === 'starter' ? 1 : a - b))) {
  const g = groups.get(k);
  if (k === 'starter') { out.push(...g.sort((a, b) => first(a.id) - first(b.id))); continue; }
  const byOld = [...g].sort((a, b) => was.get(a.id) - was.get(b.id)), slot = new Map(byOld.map((w, i) => [w.id, i]));
  const scored = g.filter(w => sc.get(w.id) > 0).sort((a, b) => sc.get(b.id) - sc.get(a.id)), fixed = new Map();
  for (const w of g) if (!(sc.get(w.id) > 0)) fixed.set(slot.get(w.id), w);
  for (let i = 0, j = 0; i < g.length; i++) out.push(fixed.get(i) ?? scored[j++]);
}
words.splice(0, words.length, ...out);
writeFileSync('data/words.json', JSON.stringify(words));
const found = words.filter(w => sc.get(w.id) > 0).length;
console.log(`${words.length} words reordered; ${found} found in wordfreq (${Math.round(found / words.length * 100)}%)`);
console.log('N5 first 30:', words.filter(w => w.j === 5).slice(12, 42).map(w => w.w || w.r).join(' '));
