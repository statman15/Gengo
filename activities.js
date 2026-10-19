import { KANA } from './kana.js';
import { speak, listen, heardMatches, heardWord } from './speech.js';
import { choices } from './session.js';
import { esc, ruby, sentenceHtml } from './ui.js';
import { loadedWords, loadedKanji } from './items.js';
import { trace } from './trace.js';
import { meaningChoices } from './words.js';
import { forWord, best } from './sentences.js';

// Each activity appends its card (and choices) to el, then calls done({correct, ms, hinted, speechFallback}) once, at the moment of answer.
// The caller owns the pause before the next item.
function quiz(el, item, card, text, kanaChoice, replay, done) {
  const opts = choices(item, KANA, Math.random);
  el.insertAdjacentHTML('beforeend', `${card}<div class="choices">${opts.map(o =>
    `<button class="choice${kanaChoice ? ' kana-choice' : ''}" data-id="${o.id}"${kanaChoice ? ' lang="ja"' : ''}>${esc(text(o))}</button>`).join('')}</div>`);
  const box = el.querySelector('.choices'), t0 = Date.now();
  let hinted = false, over = false;
  if (replay) el.querySelector('[data-replay]').onclick = () => { hinted = true; speak(item.kana); };
  box.onclick = e => {
    const b = e.target.closest('[data-id]');
    if (!b || over) return;
    over = true;
    const correct = b.dataset.id === item.id;
    box.querySelector(`[data-id="${item.id}"]`).classList.add('right');
    if (!correct) b.classList.add('wrong');
    done({ correct, ms: Date.now() - t0, hinted });
  };
}

// Never await speak(): it has no timeout and iOS may not fire onend.
export function hear(el, item, done) {
  speak(item.kana);
  quiz(el, item, '<button class="plate card" data-replay aria-label="Play the sound again"><p class="prompt">Which kana did you hear?</p><p class="prompt">Tap to hear it again</p></button>',
    o => o.kana, true, true, done);
}

export function see(el, item, done) {
  quiz(el, item, `<div class="plate card"><div class="kana" lang="ja">${item.kana}</div><p class="prompt">Which sound?</p></div>`,
    o => o.sound, false, false, done);
}

export function say(el, item, done) {
  el.insertAdjacentHTML('beforeend', `<div class="plate card"><div class="kana" lang="ja">${item.kana}</div><p class="prompt">Say it aloud</p></div>`);
  const prompt = el.querySelector('.prompt'), t0 = Date.now();
  (async () => {
    for (let miss = 0; miss < 2; miss++) {
      if (heardMatches(await listen(), item)) return done({ correct: true, ms: Date.now() - t0, hinted: false });
      if (!el.isConnected) return; // left the session while listening
      if (!miss) prompt.textContent = 'Try once more';
    }
    prompt.textContent = item.sound;
    speak(item.kana);
    done({ correct: true, ms: Date.now() - t0, hinted: true, speechFallback: true });
  })();
}

// ---- Words. ctx = { known(id) -> bool, caps?, rand? }. Furigana shows only for words not yet known; a tap on a kanji word peeks.
export const shuffle = (a, rand) => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
const gloss = it => it.m?.[0] ?? '';
export const canWord = (item, caps) => rung => rung === 'hear' ? !!caps.canHear : rung === 'say' ? !!caps.canSay : rung === 'read' ? forWord(item.id).length > 0 : true;

// Reading -> tiles: small kana and ー join the tile before.
export const splitReading = r => [...r].reduce((o, c) => (o.length && 'ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー'.includes(c) ? o[o.length - 1] += c : o.push(c), o), []);

// Tap tiles to fill slots, tap a placed one to take it back. Calls done({correct, ms}) once the slots are full (answer.length chars); the caller adds hints.
export function tileTray(el, pieces, answer, done, slots = answer.length, fmt = esc) {
  if (!el.querySelector('.tray')) el.insertAdjacentHTML('beforeend', '<div class="tray" lang="ja"></div>');
  el.insertAdjacentHTML('beforeend', `<div class="choices tiles" lang="ja">${pieces.map((p, i) =>
    `<button class="choice kana-choice" data-i="${i}">${fmt(p)}</button>`).join('')}</div>`);
  const tray = el.querySelector('.tray'), box = el.querySelector('.tiles'), t0 = Date.now(), placed = [];
  let over = false;
  const draw = () => {
    tray.innerHTML = placed.map(i => `<button class="slot" data-i="${i}">${fmt(pieces[i])}</button>`).join('') +
      '<i class="slot"></i>'.repeat(Math.max(0, slots - placed.length));
    box.querySelectorAll('.choice').forEach(b => b.classList.toggle('used', placed.includes(+b.dataset.i)));
    const said = placed.map(i => pieces[i]).join('');
    if (said.length < answer.length) return;
    over = true;
    const correct = said === answer;
    tray.classList.add(correct ? 'right' : 'wrong');
    box.querySelectorAll('.choice').forEach(b => b.disabled = true);
    done({ correct, ms: Date.now() - t0 });
  };
  box.onclick = e => { const b = e.target.closest('[data-i]'); if (b && !over && !placed.includes(+b.dataset.i)) { placed.push(+b.dataset.i); draw(); } };
  tray.onclick = e => { const b = e.target.closest('button[data-i]'); if (b && !over) { placed.splice(placed.indexOf(+b.dataset.i), 1); draw(); } };
  draw();
}

// Four meaning choices under a card the caller built. after() runs on answer.
export function meaning(el, item, card, done, ctx, after) {
  const opts = meaningChoices(item, loadedWords(), ctx.rand ?? Math.random);
  el.insertAdjacentHTML('beforeend', `${card}<div class="choices gloss">${opts.map(o => `<button class="choice" data-id="${esc(o.id)}">${esc(gloss(o))}</button>`).join('')}</div>`);
  const box = el.querySelector('.choices'), t0 = Date.now();
  let over = false, hinted = false;
  el.querySelectorAll('[data-replay]').forEach(b => b.addEventListener('click', () => { hinted = true; speak(item.r); }));
  el.addEventListener('click', e => { // tap a kanji word to peek its reading; peeking at the reviewed word is a hint
    const r = e.target.closest('ruby');
    if (!r || r.classList.contains('on')) return;
    if (!over && r.closest('mark, .kana')) hinted = true;
    r.classList.add('on');
  });
  box.onclick = e => {
    const b = e.target.closest('[data-id]');
    if (!b || over) return;
    over = true;
    const correct = b.dataset.id === item.id;
    box.querySelector(`[data-id="${CSS.escape(item.id)}"]`).classList.add('right');
    if (!correct) b.classList.add('wrong');
    after?.();
    done({ correct, ms: Date.now() - t0, hinted });
  };
}

const showRuby = (item, ctx) => !ctx.known(item.id);

const word = {
  hear(el, item, done, ctx) {
    speak(item.r);
    meaning(el, item, '<button class="plate card" data-replay aria-label="Play the word again"><p class="prompt">What does it mean?</p><p class="prompt">Tap to hear it again</p></button>', done, ctx);
  },
  see(el, item, done, ctx) {
    meaning(el, item, `<div class="plate card"><div class="kana word" lang="ja">${ruby(item.w, item.r, showRuby(item, ctx))}</div><p class="prompt">What does it mean?</p></div>`, done, ctx);
  },
  read(el, item, done, ctx) {
    const s = best(forWord(item.id), ctx.known, ctx.rand ?? Math.random);
    el.insertAdjacentHTML('beforeend', `<div class="plate card sentence"><p lang="ja">${sentenceHtml(s, item.id, id => !ctx.known(id))}</p><p class="prompt">What does the marked word mean?</p><p class="prompt en" hidden>${esc(s.en)}</p></div>`);
    meaning(el, item, '', done, ctx, () => el.querySelector('.en').hidden = false);
  },
  tiles(el, item, done, ctx) {
    const rand = ctx.rand ?? Math.random, pieces = splitReading(item.r), kata = /[ァ-ヶ]/.test(item.r[0]);
    const spare = shuffle(KANA.filter(k => k.script === (kata ? 'kata' : 'hira') && !pieces.includes(k.kana)), rand).slice(0, 2).map(k => k.kana);
    el.insertAdjacentHTML('beforeend', `<div class="plate card"><p class="prompt">Build the word for</p><p class="gloss-big">${esc(gloss(item))}</p><div class="tray" lang="ja"></div><button class="hint" data-replay>Hear it</button></div>`);
    let hinted = false;
    el.querySelector('[data-replay]').onclick = () => { hinted = true; speak(item.r); };
    tileTray(el, shuffle([...pieces, ...spare], rand), item.r, r => {
      if (!r.correct) el.querySelector('.prompt').textContent = item.r;
      done({ ...r, hinted });
    }, pieces.length);
  },
  say(el, item, done) {
    el.insertAdjacentHTML('beforeend', `<div class="plate card"><p class="gloss-big">${esc(gloss(item))}</p><p class="prompt">Say it in Japanese</p></div>`);
    const prompt = el.querySelector('.prompt'), t0 = Date.now();
    (async () => {
      for (let miss = 0; miss < 2; miss++) {
        if (heardWord(await listen(), item)) return done({ correct: true, ms: Date.now() - t0, hinted: false });
        if (!el.isConnected) return;
        if (!miss) prompt.textContent = 'Try once more';
      }
      prompt.textContent = `${item.w}  ${item.r}`;
      speak(item.r);
      done({ correct: true, ms: Date.now() - t0, hinted: true, speechFallback: true });
    })();
  },
};
// ---- Kanji. A kanji's one reading for drills: its first on reading (katakana), else its first kun; KANJIDIC's . and - dropped.
export const kanjiReading = k => (k.on[0] ?? k.kun[0] ?? '').replace(/[-.]/g, '');
// Four choices: this kanji plus three whose text(x) differs, shuffled.
function kanjiPick(el, it, prompt, text, done, rand = Math.random) {
  const seen = new Set([text(it)]), opts = [it];
  for (const x of shuffle(loadedKanji().filter(x => x.id !== it.id), rand)) if (opts.length < 4 && text(x) && !seen.has(text(x))) { seen.add(text(x)); opts.push(x); }
  el.insertAdjacentHTML('beforeend', `<div class="plate card"><div class="kana" lang="ja">${esc(it.k)}</div><p class="prompt">${prompt}</p></div><div class="choices gloss">${
    shuffle(opts, rand).map(o => `<button class="choice" data-id="${esc(o.id)}"${/[ァ-ヶぁ-ゖ]/.test(text(o)) ? ' lang="ja"' : ''}>${esc(text(o))}</button>`).join('')}</div>`);
  const box = el.querySelector('.choices'), t0 = Date.now();
  let over = false;
  box.onclick = e => {
    const b = e.target.closest('[data-id]');
    if (!b || over) return;
    over = true;
    box.querySelector(`[data-id="${CSS.escape(it.id)}"]`).classList.add('right');
    if (b.dataset.id !== it.id) b.classList.add('wrong');
    done({ correct: b.dataset.id === it.id, ms: Date.now() - t0, hinted: false });
  };
}
const kanji = {
  see: (el, it, done, ctx) => kanjiPick(el, it, 'What does it mean?', x => x.m[0], done, ctx?.rand),
  sound: (el, it, done, ctx) => kanjiPick(el, it, 'How is it read?', kanjiReading, done, ctx?.rand),
  trace,
};
export const ACTS = { word, kanji };
