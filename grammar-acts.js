// Grammar lessons and the fill / form / build activities. Same done({correct, ms, hinted}) contract as activities.js.
import { speak } from './speech.js';
import { esc, ruby, sentenceHtml, sheet } from './ui.js';
import { ACTS, shuffle, tileTray } from './activities.js';
import { conjugate, FORMS } from './conjugate.js';
import { forPoint, best } from './sentences.js';
import { loadedWords } from './items.js';
import { db } from './store.js';

const plain = jp => jp.replace(/[\[\] ]/g, '');
// A point example as a tagged sentence: tokens [surface, '', id] ('.' = punctuation), with `at` the [bracketed] one.
const exSeg = e => { const w = e.jp.split(' '); return { en: e.en, at: w.findIndex(x => x[0] === '['), t: w.map(x => [x.replace(/[\[\]]/g, ''), '', /^[。、？！]$/.test(x) ? '.' : '']) }; };

export const lessonHtml = p => `<div class="lesson"><h2 lang="ja">${esc(p.title)}</h2><p class="en">${esc(p.en)}</p><p>${esc(p.explain)}</p>${p.ex.map(e =>
  `<div class="ex"><button class="hint" data-hear="${esc(plain(e.jp))}" aria-label="Hear it">▶</button><div><span lang="ja">${esc(plain(e.jp))}</span><br>${esc(e.en)}</div></div>`).join('')}</div>`;
export const wireHear = body => body.onclick = e => { const b = e.target.closest('[data-hear]'); if (b) speak(b.dataset.hear); };

// The first grammar-token segment whose surface is the blank (a particle in a tagged sentence), or -1.
export const blankIndex = (t, blank) => t.findIndex(([sf, , id]) => sf === blank && id === '');
// Learned words whose pos starts with one of p.pos and that conjugate in all of p.forms.
export const formWords = (p, cards, words) => words.filter(w => cards[w.id] && p.pos.some(x => w.f.startsWith(x)) && p.forms.every(f => conjugate(w.r, w.f, f)));
export const canGrammar = (p, cards) => rung => rung !== 'form' || formWords(p, cards, loadedWords()).length > 0;

// A tagged sentence for the point that passes keep, else one of its examples.
const sentence = (p, ctx, keep) => {
  const s = best(forPoint(p.id).filter(keep), ctx.known, ctx.rand ?? Math.random);
  return s ? { ...s, at: p.blank ? blankIndex(s.t, p.blank) : -1 } : exSeg(p.ex[Math.floor((ctx.rand ?? Math.random)() * p.ex.length)]);
};

// A card and a grid of text choices; after(correct) runs on answer.
function pick(el, card, opts, right, done, after) {
  el.insertAdjacentHTML('beforeend', `${card}<div class="choices${opts.some(o => o.length > 5) ? ' long' : ''}" lang="ja">${opts.map(o => `<button class="choice kana-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`);
  const box = el.querySelector('.choices'), t0 = Date.now();
  let over = false;
  box.onclick = e => {
    const b = e.target.closest('[data-v]');
    if (!b || over) return;
    over = true;
    const correct = b.dataset.v === right;
    box.querySelectorAll('.choice').forEach(c => c.dataset.v === right && c.classList.add('right'));
    if (!correct) b.classList.add('wrong');
    after?.();
    done({ correct, ms: Date.now() - t0 });
  };
}

const grammar = {
  fill(el, p, done, ctx) {
    const s = sentence(p, ctx, s => p.blank && blankIndex(s.t, p.blank) >= 0), t = s.t.map((x, i) => i === s.at ? ['＿＿', '', ''] : x), right = s.t[s.at][0];
    pick(el, `<div class="plate card sentence"><p lang="ja">${sentenceHtml({ t }, '', id => !ctx.known(id)).replace('＿＿', '<span class="blank">＿＿</span>')}</p><p class="prompt en">${esc(s.en)}</p></div>`,
      shuffle([...p.choices], ctx.rand ?? Math.random), right, done, () => el.querySelector('.blank').textContent = right);
  },
  form(el, p, done, ctx) {
    const rand = ctx.rand ?? Math.random, ws = formWords(p, db.cards, loadedWords()), w = ws[Math.floor(rand() * ws.length)], target = p.forms[0];
    pick(el, `<div class="plate card"><div class="kana word" lang="ja">${ruby(w.w, w.r, !ctx.known(w.id))}</div><p class="gloss-big">${esc(FORMS[target])}</p></div>`,
      shuffle(p.forms.map(f => conjugate(w.r, w.f, f)), rand), conjugate(w.r, w.f, target), done);
  },
  build(el, p, done, ctx) {
    const s = sentence(p, ctx, s => s.t.filter(x => x[2] !== '.').length <= 8), segs = s.t.filter(x => x[2] !== '.'), answer = segs.map(x => x[0]).join('');
    const html = new Map(segs.map(([sf, r, id]) => [sf, id[0] === 'w' ? ruby(sf, r, !ctx.known(id)) : esc(sf)]));
    el.insertAdjacentHTML('beforeend', `<div class="plate card sentence"><p class="prompt">Build the sentence</p><p class="gloss-big">${esc(s.en)}</p><div class="tray" lang="ja"></div></div>`);
    tileTray(el, shuffle(segs.map(x => x[0]), ctx.rand ?? Math.random), answer, r => {
      if (!r.correct) el.querySelector('.prompt').textContent = answer;
      done(r);
    }, segs.length, sf => html.get(sf));
    el.querySelector('.tiles').classList.add('words');
  },
};

// Every grammar review gets a "why?" link: it opens the lesson and counts as a hint.
ACTS.grammar = Object.fromEntries(Object.entries(grammar).map(([k, run]) => [k, (el, p, done, ctx = {}) => {
  let hinted = false;
  run(el, p, r => done({ ...r, hinted }), ctx);
  el.querySelector('.plate.card').insertAdjacentHTML('beforeend', '<button class="why" data-why>why?</button>');
  el.querySelector('[data-why]').onclick = () => { hinted = true; wireHear(sheet(lessonHtml(p))); };
}]));
