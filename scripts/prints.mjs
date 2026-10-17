// Run by hand: node scripts/prints.mjs   (Node 22). Downloads (at <=1600 px) the largest Hōeidō scan of each station from Wikimedia Commons
// to prints/NN.jpg (NN-1 = station index) and rewrites prints/CREDITS.md. ~1 request/second.
import { writeFileSync } from 'node:fs';
import { STATIONS } from '../journey.js';

const UA = { 'User-Agent': 'Gengo/0.1 (ressler.chris@gmail.com)' };
const wait = () => new Promise(r => setTimeout(r, 1000));
const api = async q => { await wait(); const r = await fetch('https://commons.wikimedia.org/w/api.php?format=json&' + new URLSearchParams(q), { headers: UA }); if (!r.ok) throw new Error(r.status); return r.json(); };

const rows = [], missing = [];
for (let i = 0; i < 55; i++) {
  const nn = String(i + 1).padStart(2, '0'), out = `prints/${String(i).padStart(2, '0')}.jpg`;
  const q = await api({ action: 'query', list: 'search', srsearch: `Hiroshige-53-Stations-Hoeido-${nn}`, srnamespace: 6, srlimit: 20 });
  const titles = q.query.search.map(s => s.title).filter(t => t.startsWith(`File:Hiroshige-53-Stations-Hoeido-${nn}-`) && /\.jpe?g$/i.test(t));
  if (!titles.length) { missing.push(STATIONS[i].name); continue; }
  const info = await api({ action: 'query', prop: 'imageinfo', iiprop: 'size|url', titles: titles.join('|') });
  const best = Object.values(info.query.pages).map(p => ({ title: p.title, ...p.imageinfo?.[0] })).filter(p => p.url).sort((a, b) => b.width - a.width)[0];
  if (!best) { missing.push(STATIONS[i].name); continue; }
  await wait(); // Special:FilePath?width=1600 re-encodes; narrower originals come back at their own size
  const r = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(best.title.slice(5))}?width=1600`, { headers: UA });
  if (!r.ok) { missing.push(STATIONS[i].name); continue; }
  writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  const k = Math.min(1, 1600 / best.width); best.height = Math.round(best.height * k); best.width = Math.round(best.width * k);
  rows.push(`| ${out.slice(7)} | ${STATIONS[i].name} | ${best.title} (${best.width}×${best.height}) |`);
  console.log(out, best.title, best.width);
}
writeFileSync('prints/CREDITS.md', `# Print credits

Utagawa Hiroshige, *The Fifty-three Stations of the Tōkaidō* (Hōeidō edition, 1833–34). Public domain. Scans from Wikimedia Commons.

| File | Station | Source file |
|---|---|---|
${rows.join('\n')}
`);
console.log('missing:', missing.join(', ') || 'none');
