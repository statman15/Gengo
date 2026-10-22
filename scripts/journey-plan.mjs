// Builds data/journey-plan.json: for each path, what a typical learner learns on each stretch of the Tōkaidō.
// Run by hand after changing the learning order, pace or stations: node scripts/journey-plan.mjs
// Simulates two years of daily study with the app's own scheduler, order and pace (an average learner, who recalls
// as often as FSRS predicts). A station is reached when that many items are mastered; a stretch is what was learned
// from reaching one station until reaching the next.
import { readFileSync, writeFileSync } from 'node:fs';

const fetchFile = async p => ({ ok: true, json: async () => JSON.parse(readFileSync(p, 'utf8')) });
const { ready, loadedWords, loadedKanji, item } = await import('../items.js');
await ready(fetchFile);
const { nextNew, dueSoon, dueQueue } = await import('../session.js');
const { budget } = await import('../pace.js');
const { newCard, review, isMastered } = await import('../srs.js');
const { TRACKS, wordOrder } = await import('../tracks.js');
const { STATIONS, stationCost } = await import('../journey.js');
const { fsrs } = await import('../vendor/ts-fsrs.js');
const f = fsrs(), DAYS = 730;

// One stretch, as a few short lines: kana, rules, phrases, words (with examples), grammar, kanji, numbers.
function summary(ids) {
  const by = k => ids.map(item).filter(x => x?.kind === k), lines = [];
  const kana = by('kana'), hira = kana.filter(k => k.script === 'hira'), kata = kana.filter(k => k.script === 'kata');
  const run = ks => ks.length > 12 ? `${ks.slice(0, 3).map(k => k.kana).join('')}…${ks.at(-1).kana} (${ks.length})` : ks.map(k => k.kana).join('');
  if (hira.length) lines.push(`Hiragana ${run(hira)}`);
  if (kata.length) lines.push(`Katakana ${run(kata)}`);
  for (const r of by('rule')) lines.push(`Spelling: ${r.title}`);
  const ph = by('phrase');
  if (ph.length) lines.push(`${ph.length} phrase${ph.length > 1 ? 's' : ''}: ${ph.slice(0, 3).map(p => p.r).join('、')}${ph.length > 3 ? '…' : ''}`);
  for (const n of by('number')) lines.push(`Numbers: ${n.title}`);
  const ws = by('word');
  if (ws.length) lines.push(`${ws.length} word${ws.length > 1 ? 's' : ''}: ${ws.slice(0, 4).map(w => w.w || w.r).join('、')}${ws.length > 4 ? '…' : ''}`);
  for (const g of by('grammar')) lines.push(`Grammar: ${g.title} (${g.en})`);
  const kj = by('kanji');
  if (kj.length) lines.push(`${kj.length} kanji: ${kj.slice(0, 12).map(k => k.k).join('')}${kj.length > 12 ? '…' : ''}`);
  return lines;
}

function plan(track) {
  const T = TRACKS[track], words = wordOrder(loadedWords(), T), kanji = loadedKanji();
  const cards = {}, days = {}, learned = [], reach = [0]; // learned: [day, id]
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const start = new Date('2026-01-05T08:00:00');
  for (let d = 0; d < DAYS && reach.length < STATIONS.length; d++) {
    const day = new Date(+start + d * 864e5), k = day.toISOString().slice(0, 10);
    const t = (days[k] = { reviews: 0, cleared: false, learned: 0, graded: 0, right: 0 });
    let now = day;
    const answer = id => { const c = cards[id], R = c.last_review ? f.get_retrievability(c, now, false) : 0.75, ok = rand() < R;
      cards[id] = review(c, ok ? 3 : 1, now); t.reviews++; t.graded++; if (ok) t.right++; };
    const drain = () => { for (let pass = 0; pass < 8; pass++) { const q = dueQueue(cards, now); if (!q.length) break; q.forEach(answer); now = new Date(+now + 15 * 60e3); } };
    drain();
    for (let b = 0; b < 10; b++) {
      const room = budget(cards, loadedWords(), days, now, k, dueSoon(cards, now), !!T.travel);
      if (room < 1) break;
      const ids = nextNew(cards, Math.min(5, room), { words, kanji, track: T });
      if (!ids.length) break;
      for (const id of ids) { cards[id] = newCard(now); learned.push([d, id]); }
      t.learned += ids.length; drain();
    }
    const mastered = Object.values(cards).filter(isMastered).length;
    while (reach.length < STATIONS.length && mastered >= stationCost(reach.length)) reach.push(d + 1);
  }
  return STATIONS.map((_, i) => ({ day: reach[i] ?? null,
    learn: reach[i] == null ? [] : summary(learned.filter(([d]) => d >= reach[i] && (reach[i + 1] == null || d < reach[i + 1])).map(([, id]) => id)) }));
}

const out = Object.fromEntries(Object.keys(TRACKS).map(t => [t, plan(t)]));
writeFileSync('data/journey-plan.json', JSON.stringify(out));
for (const [t, p] of Object.entries(out)) console.log(t, 'reached:', p.filter(s => s.day != null).length, 'of', p.length, '| days', [1, 5, 10, 14, 20, 30, 40, 54].map(i => `${i}:${p[i].day}`).join(' '));
