// Today's story: the AI writes a short kana scene at your Tōkaidō station using your due words; one question per word reviews it.
import { GRAMMAR } from './grammar.js';
import { item } from './items.js';
import { chat, json } from './ai.js';
import { KANA } from './kana.js';

// Prompt rules that keep the AI to what the learner has learned: their words, their kana, their grammar.
// ponytail: the list is capped at 400 words (most recent last); trim further if prompts get slow on a free key.
export function limits(cards) {
  const words = Object.keys(cards).map(item).filter(x => x?.kind === 'word').slice(-400).map(w => `${w.r}=${w.m[0]}`);
  const kana = KANA.filter(k => cards[k.id]).map(k => k.kana), grammar = GRAMMAR.filter(g => cards[g.id]).map(g => `${g.title} (${g.en})`);
  return `- Use ONLY words the learner has learned (any polite form of them), plus particles and です/ます. If you need another word, say it differently with these. Learned words: ${words.join(', ') || '(none yet)'}.
${kana.length < KANA.length ? `- Use ONLY these kana: ${kana.join('')}.
` : ''}- ${grammar.length ? `Grammar the learner knows: ${grammar.join(', ')}. Use nothing more advanced.` : 'Use only the simplest grammar.'}`;
}

export const MIN = 5, MAX = 8;
// Due word ids (most overdue first) the story will use; the story card shows once there are MIN.
export const storyWords = due => due.filter(id => item(id)?.kind === 'word').slice(0, MAX);

export function prompt(words, cards, station) {
  return [
    { role: 'system', content: 'You write very short Japanese reading practice for a beginner. Reply with JSON only, no other text.' },
    { role: 'user', content: `Write 4-6 short lines: a tiny story, or a conversation between two people, set at ${station.jp} (${station.name}) on the old Tōkaidō road. The scene: ${station.scene}.
Rules:
- Write only in hiragana and katakana. No kanji at all.
- Natural Japanese comes first: every line must be something a native speaker would really say. Use as many of the numbered words below as fit naturally (aim for all, but never force one in; a word left out simply stays for another day). Write each use ONLY as 【kana|n】 (n = its number, kana = the form you used, which may be conjugated), never also outside the brackets. Example: 【はい|1】、【いきます|2】。 Mark only the numbered words.
- Short, simple sentences in polite です/ます style.
${limits(cards)}
Words:
${words.map((w, i) => `${i + 1}. ${w.r}${w.w ? ` (${w.w})` : ''}: ${w.m[0]}`).join('\n')}
Reply in this shape: {"title":"<short English title>","lines":[{"jp":"…","en":"<English translation of the line>"}]}` },
  ];
}

const MARK = /【([^|】]*)(?:\|([^】]*))?】/g; // the number may be missing or junk (|N/A): then it's plain text
// Reply -> { title, lines: [{ jp, en, segs: [[text, id?]...] }], ids: word ids that appear }. Marks with an unknown or missing number
// become plain text; models often write the word and then repeat it in the mark (おはよう【おはよう|6】), so that echo is dropped.
export function parse(text, words) {
  const r = json(text), ids = new Set();
  const lines = (Array.isArray(r.lines) ? r.lines : []).filter(l => typeof l?.jp === 'string' && l.jp.trim()).slice(0, 8).map(l => {
    const segs = [];
    let at = 0;
    for (const m of l.jp.matchAll(MARK)) {
      let before = l.jp.slice(at, m.index);
      if (m[1] && before.endsWith(m[1])) before = before.slice(0, -m[1].length);
      if (before) segs.push([before]);
      const w = words[+m[2] - 1];
      if (m[1]) segs.push(w ? [m[1], w.id] : [m[1]]);
      if (w) ids.add(w.id);
      at = m.index + m[0].length;
    }
    if (at < l.jp.length) segs.push([l.jp.slice(at)]);
    return { jp: segs.map(s => s[0]).join(''), en: String(l.en ?? ''), segs };
  });
  if (!lines.length) throw new Error('The AI didn\'t send back a story. Try again.');
  if (!ids.size) throw new Error('The AI\'s story didn\'t use any of your words. Try again.');
  return { title: String(r.title ?? '').slice(0, 80), lines, ids: words.map(w => w.id).filter(id => ids.has(id)) };
}

// One story a day, kept on this phone (not in backups) so reopening it doesn't ask the AI again.
const KEY = 'gengo-story';
const mem = {};
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
export const saved = day => { try { const s = JSON.parse(ls.getItem(KEY)); return s?.day === day && Array.isArray(s.lines) && Array.isArray(s.ids) && Array.isArray(s.done) && s.lines.every(l => Array.isArray(l?.segs)) ? s : null; } catch { return null; } }; // a broken copy is ignored
export const keep = s => ls.setItem(KEY, JSON.stringify(s));

// One request at a time: leaving and reopening the story while it is being written reuses the same request.
let pending = null;
export const write = (day, ids, cards, station) => pending ??= (async () => {
  const words = ids.map(item);
  const s = { day, done: [], ...parse(await chat(prompt(words, cards, station)), words) };
  keep(s);
  return s;
})().finally(() => { pending = null; });
