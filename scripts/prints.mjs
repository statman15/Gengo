// Run by hand: node scripts/prints.mjs   (Node 22). Downloads the largest Hōeidō scan of each station from Wikimedia Commons
// to prints/NN.jpg (NN-1 = station index) and rewrites prints/CREDITS.md. ~1 request/second.
import { writeFileSync, existsSync } from 'node:fs';
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
  if (!(i === 0 && existsSync(out) && best.width <= 1600)) { // 00.jpg: keep the existing scan unless a larger one exists
    await wait();
    const r = await fetch(best.url, { headers: UA });
    if (!r.ok) { missing.push(STATIONS[i].name); continue; }
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  }
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
