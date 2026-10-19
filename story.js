// Today's story: the AI writes a short kana scene at your Tōkaidō station using your due words; one question per word reviews it.
import { GRAMMAR } from './grammar.js';
import { item } from './items.js';
import { chat, json } from './ai.js';

export const MIN = 5, MAX = 8;
// Due word ids (most overdue first) the story will use; the story card shows once there are MIN.
export const storyWords = due => due.filter(id => item(id)?.kind === 'word').slice(0, MAX);

export function prompt(words, cards, station) {
  const known = GRAMMAR.filter(g => cards[g.id]).map(g => `${g.title} (${g.en})`);
  return [
    { role: 'system', content: 'You write very short Japanese reading practice for a beginner. Reply with JSON only, no other text.' },
    { role: 'user', content: `Write 4-6 short lines: a tiny story, or a conversation between two people, set at ${station.jp} (${station.name}) on the old Tōkaidō road. The scene: ${station.scene}.
Rules:
- Write only in hiragana and katakana. No kanji at all.
- Use every word below at least once. Mark each use as 【kana|n】, where n is the word's number and kana is the form you used (it may be conjugated).
- Short, simple sentences in polite です/ます style.${known.length ? ` Grammar the reader knows: ${known.join(', ')}. Use little else.` : ' Use only the simplest grammar.'}
Words:
${words.map((w, i) => `${i + 1}. ${w.r}${w.w ? ` (${w.w})` : ''}: ${w.m[0]}`).join('\n')}
Reply in this shape: {"title":"<short English title>","lines":[{"jp":"…","en":"<English translation of the line>"}]}` },
  ];
}

const MARK = /【([^|】]+)\|(\d+)】/g;
// Reply -> { title, lines: [{ jp, en, segs: [[text, id?]...] }], ids: word ids that appear }. Marks with an unknown number become plain text.
export function parse(text, words) {
  const r = json(text), ids = new Set();
  const lines = (Array.isArray(r.lines) ? r.lines : []).filter(l => typeof l?.jp === 'string' && l.jp.trim()).slice(0, 8).map(l => {
    const segs = [];
    let at = 0;
    for (const m of l.jp.matchAll(MARK)) {
      if (m.index > at) segs.push([l.jp.slice(at, m.index)]);
      const w = words[+m[2] - 1];
      segs.push(w ? [m[1], w.id] : [m[1]]);
      if (w) ids.add(w.id);
      at = m.index + m[0].length;
    }
    if (at < l.jp.length) segs.push([l.jp.slice(at)]);
    return { jp: segs.map(s => s[0]).join(''), en: String(l.en ?? ''), segs };
  });
  if (!lines.length) throw new Error('The AI didn\'t send back a story. Try again.');
  return { title: String(r.title ?? '').slice(0, 80), lines, ids: words.map(w => w.id).filter(id => ids.has(id)) };
}

// One story a day, kept on this phone (not in backups) so reopening it doesn't ask the AI again.
const KEY = 'gengo-story';
const mem = {};
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
export const saved = day => { try { const s = JSON.parse(ls.getItem(KEY)); return s?.day === day ? s : null; } catch { return null; } };
export const keep = s => ls.setItem(KEY, JSON.stringify(s));

// One request at a time: leaving and reopening the story while it is being written reuses the same request.
let pending = null;
export const write = (day, ids, cards, station) => pending ??= (async () => {
  const words = ids.map(item);
  const s = { day, done: [], ...parse(await chat(prompt(words, cards, station)), words) };
  keep(s);
  return s;
})().finally(() => { pending = null; });
