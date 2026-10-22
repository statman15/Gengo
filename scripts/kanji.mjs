// Builds data/kanji.json: the old-JLPT 4 and 3 kanji (≈ N5, N4) from KANJIDIC2 with their KanjiVG strokes, N5 first, then by frequency.
// Run by hand: node scripts/kanji.mjs [cacheDir]. Downloads are cached in cacheDir (default: OS temp);
// pre-fetch with `curl -L --retry 5 -C -` into it as kanjidic.tgz and kanjivg.xml.gz if fetch gets truncated.
import { gunzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cache = process.argv[2] || join(tmpdir(), 'gengo-kanji');
mkdirSync(cache, { recursive: true });
const get = async (name, url) => {
  const f = join(cache, name);
  if (!existsSync(f)) { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  return readFileSync(f);
};
function untar(buf) { // first regular file
  for (let o = 0; o + 512 <= buf.length;) {
    const size = parseInt(buf.toString('latin1', o + 124, o + 135).trim() || '0', 8), type = String.fromCharCode(buf[o + 156] || 48);
    if (type === '0') return buf.subarray(o + 512, o + 512 + size);
    o += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error('no file in tgz');
}

const rel = await fetch('https://api.github.com/repos/scriptin/jmdict-simplified/releases/latest').then(r => r.json());
const asset = rel.assets.find(a => /^kanjidic2-en-.*\.json\.tgz$/.test(a.name));
const dic = JSON.parse(untar(gunzipSync(await get('kanjidic.tgz', asset.browser_download_url))).toString('utf8'));
const vg = gunzipSync(await get('kanjivg.xml.gz', 'https://github.com/KanjiVG/kanjivg/releases/download/r20260714/kanjivg-20260714.xml.gz')).toString('utf8');

// KanjiVG: <kanji id="kvg:kanji_065e5"> ... <path id="kvg:065e5-s1" d="..."/> in stroke order. Variant files (-Kaisho etc.) are skipped.
const strokes = {};
for (const m of vg.matchAll(/<kanji id="kvg:kanji_([0-9a-f]+)">([\s\S]*?)<\/kanji>/g))
  strokes[String.fromCodePoint(parseInt(m[1], 16))] = [...m[2].matchAll(/<path id="kvg:[0-9a-f]+-s\d+"[^>]*\sd="([^"]+)"/g)].map(p => p[1]);

const out = [];
for (const c of dic.characters) {
  const j = c.misc.jlptLevel, s = strokes[c.literal];
  if (!(j === 4 || j === 3) || !s?.length) continue;
  const g = c.readingMeaning?.groups ?? [], rd = t => g.flatMap(x => x.readings).filter(r => r.type === t).map(r => r.value);
  out.push({ id: 'k-' + c.literal, k: c.literal, m: g.flatMap(x => x.meanings).filter(x => x.lang === 'en').map(x => x.value).filter(v => !/^-|\.$|^don$/.test(v)).slice(0, 3), // drop suffixes (-times), abbreviations (Inst.) and the confusing 'don'
    on: rd('ja_on').slice(0, 3), kun: rd('ja_kun').slice(0, 3), j: j === 4 ? 5 : 4, fr: c.misc.frequency ?? 9999, s });
}
out.sort((a, b) => b.j - a.j || a.fr - b.fr);
for (const x of out) delete x.fr;
mkdirSync('data', { recursive: true });
writeFileSync('data/kanji.json', JSON.stringify(out));
console.log(out.length, 'kanji;', out.filter(x => x.j === 5).length, 'N5;', Buffer.byteLength(JSON.stringify(out)), 'bytes');
