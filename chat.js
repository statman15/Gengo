// Today's chat: someone at your Tōkaidō station talks with you for TURNS replies, steering toward your due words.
// The AI grades each word at the end; that is the word's review.
import { item } from './items.js';
import { chat, json } from './ai.js';
import { limits } from './story.js';

export const MIN = 3, MAX = 5, TURNS = 5;
// Due words for the chat, preferring ones today's story didn't use.
export const chatWords = (due, avoid = []) => {
  const ws = due.filter(id => item(id)?.kind === 'word');
  return [...ws.filter(id => !avoid.includes(id)), ...ws.filter(id => avoid.includes(id))].slice(0, MAX);
};

const list = words => words.map((w, i) => `${i + 1}. ${w.r}${w.w ? ` (${w.w})` : ''}: ${w.m[0]}`).join('\n');

// The whole conversation so far as chat messages: the setup, then the AI's turns (as its JSON) and the learner's replies.
export function messages(c, words, cards) {
  return [
    { role: 'system', content: `You are a character in a Japanese conversation practice app for a beginner. Reply with JSON only, no other text.
Scene: ${c.station.jp} (${c.station.name}) on the old Tōkaidō road: ${c.station.scene}. Pick who you are from the scene (a teahouse owner, a porter, a fellow traveller...) and talk with the learner, a traveller passing through.
Rules:
- Write only in hiragana and katakana. No kanji at all.
- 1-2 short sentences per turn, polite です/ます style.
${limits(cards)}
- Over ${TURNS} replies from the learner, ask questions that invite them to use these words, one or two at a time:
${list(words)}
- Everything you say must be natural Japanese a native speaker would really say; never force a word into an odd sentence.
- If the learner makes a mistake, don't correct it; just carry on naturally.
Reply each turn in this shape: {"who":"<who you are, in English, 1-3 words>","jp":"…","en":"<English of your line>","hint":"<one short, natural answer to your line that the learner could give, in kana, using one of the words if it fits>"}` },
    { role: 'user', content: '(Start the conversation.)' },
    ...c.log.map(l => l.me ? { role: 'user', content: l.jp } : { role: 'assistant', content: JSON.stringify({ jp: l.jp, en: l.en, hint: l.hint }) }),
  ];
}

const str = v => typeof v === 'string' ? v.trim() : '';
export function parseTurn(text) {
  const r = json(text), jp = str(r.jp);
  if (!jp) throw new Error('The AI didn\'t send back a reply. Try again.');
  return { jp: jp.slice(0, 200), en: str(r.en).slice(0, 300), hint: str(r.hint).slice(0, 100), who: str(r.who).slice(0, 30) };
}

export function gradeMessages(c, words) {
  let n = 0;
  const transcript = c.log.map(l => l.me ? `Learner (reply ${++n}): ${l.jp}` : `Them: ${l.jp}`).join('\n');
  return [
    { role: 'system', content: 'You are a kind Japanese teacher grading a beginner’s practice conversation. Reply with JSON only, no other text.' },
    { role: 'user', content: `The learner was asked to use these words:
${list(words)}

The conversation:
${transcript}

For each word, say whether the learner used it correctly ("right": the right meaning, in a reply that makes sense as an answer to what was said; any form, kana or kanji), wrongly ("wrong": wrong meaning, or a reply that doesn't fit the conversation), or not at all ("no"), and in which of their replies (its number, 0 if not used). Be honest; a word dropped into a reply that doesn't answer the question is "wrong".
List up to 3 of the learner's replies that had mistakes, each with a corrected version in kana and a short English reason.
Reply in this shape: {"words":[{"n":1,"used":"right","reply":2}],"fixes":[{"reply":3,"fix":"…","why":"…"}],"note":"<one or two encouraging English sentences>"}` },
  ];
}

// Grade reply -> per word id: { used: 'right'|'wrong'|'no', reply }, plus fixes and a note. Anything unreadable counts as "no".
export function parseGrade(text, words) {
  const r = json(text), by = {};
  for (const x of Array.isArray(r.words) ? r.words : []) {
    const w = words[+x?.n - 1];
    if (w && ['right', 'wrong', 'no'].includes(x.used)) by[w.id] = { used: x.used, reply: +x.reply || 0 };
  }
  const result = Object.fromEntries(words.map(w => [w.id, by[w.id] ?? { used: 'no', reply: 0 }]));
  const fixes = (Array.isArray(r.fixes) ? r.fixes : []).slice(0, 3).map(f => ({ reply: +f?.reply || 0, fix: str(f?.fix).slice(0, 200), why: str(f?.why).slice(0, 200) })).filter(f => f.fix);
  return { words: result, fixes, note: str(r.note).slice(0, 300) };
}

// FSRS rating per graded word: right 3 (2 if that reply came from Suggest), wrong 1, not used: no review (null).
export const rating = (g, log) => {
  if (g.used === 'no') return null;
  if (g.used === 'wrong') return 1;
  return log.filter(l => l.me)[g.reply - 1]?.helped ? 2 : 3;
};
export const replies = c => c.log.filter(l => l.me).length;

// One chat a day, kept on this phone (not in backups): leaving and coming back continues it.
const KEY = 'gengo-chat';
const mem = {};
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
export const saved = day => { try { const s = JSON.parse(ls.getItem(KEY)); return s?.day === day && Array.isArray(s.ids) && Array.isArray(s.log) && s.log.every(l => typeof l?.jp === 'string') && s.station ? s : null; } catch { return null; } }; // a broken copy is ignored
export const keep = c => ls.setItem(KEY, JSON.stringify(c));

// One request at a time (a reopened view reuses it). Adds the AI's next line, or after the last reply, the grade.
let pending = null;
export const next = (c, cards) => pending ??= (async () => {
  const words = c.ids.map(item).filter(Boolean);
  if (replies(c) >= TURNS) c.grade = parseGrade(await chat(gradeMessages(c, words)), words);
  else { const t = parseTurn(await chat(messages(c, words, cards))); c.who ||= t.who; delete t.who; c.log.push(t); }
  keep(c);
  return c;
})().finally(() => { pending = null; });
