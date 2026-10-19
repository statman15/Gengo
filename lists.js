// "My words" (search, paste a list, custom words) and the Grammar list.
import { $, esc, sheet, nav, ruby } from './ui.js';
import { db, addMine, addCustom, parseList } from './store.js';
import { search } from './words.js';
import { item, loadedWords } from './items.js';
import { GRAMMAR } from './grammar.js';
import { lessonHtml, wireHear } from './grammar-acts.js';
import { stageHere } from './board.js';

const KANA = /^[ぁ-ゖァ-ヺー]+$/;
const mark = id => db.cards[id] ? 'Learning' : db.mine.words.includes(id) ? 'Added' : '';
const wrow = (x, label = true) => `<div class="plate set"><span lang="ja">${ruby(x.w, x.r, true)}<br><small>${esc(x.m[0])}</small></span>${
  mark(x.id) ? (label ? `<span class="muted">${mark(x.id)}</span>` : '') : `<span class="acts"><button data-add="${esc(x.id)}">Add</button></span>`}</div>`;
const mine = f => db.mine.words.map(item).filter(x => x && f(x.id)).map(x => wrow(x, false)).join('');
let q = '';

const customForm = line => `<form class="plate set" data-line><span>${esc(line)}<input name="r" aria-label="Reading in kana" placeholder="Reading (kana)" value="${KANA.test(line) ? esc(line) : ''}"><input name="m" aria-label="Meaning" placeholder="Meaning"><input name="w" aria-label="Written form" placeholder="Written form (optional)" value="${KANA.test(line) ? '' : esc(line)}"><small class="muted" data-err hidden></small></span><button class="acts">Add your own</button></form>`;

export const words = { render: el => {
  stageHere();
  const again = () => words.render(el);
  const list = () => { const hits = search(loadedWords(), q).map(wrow).join(''); $('.hits', el).innerHTML = hits || (q.trim() ? '<p class="plate set muted">No match</p>' : ''); };
  el.innerHTML = `<div class="screen setlist"><h1 class="plate">My words</h1>
    <input class="plate set" type="search" aria-label="Search words" placeholder="Search Japanese or English" autocomplete="off" value="${esc(q)}">
    <div class="hits"></div><button class="plate" data-paste>Paste a list</button>
    <div class="lists"><h2 class="plate set">Next up</h2>${mine(id => !db.cards[id]) || '<p class="plate set muted">Nothing queued</p>'}
      <h2 class="plate set">Learning</h2>${mine(id => db.cards[id]) || '<p class="plate set muted">Nothing yet</p>'}</div>
    <div class="grow"></div>${nav('')}</div>`;
  list();
  $('[type=search]', el).oninput = e => { q = e.target.value; list(); };
  el.onclick = e => {
    const b = e.target.closest('[data-add]');
    if (b) { addMine('words', b.dataset.add); again(); }
    if (!e.target.closest('[data-paste]')) return;
    const s = sheet('<form><p>One word per line</p><textarea name="t" rows="8" aria-label="Words to add"></textarea><button class="plate">Add words</button></form>');
    $('#sheet').addEventListener('close', again, { once: true });
    $('form', s).onsubmit = ev => {
      ev.preventDefault();
      const { found, unknown } = parseList(ev.target.t.value, loadedWords());
      const n = found.filter(x => addMine('words', x.id)).length;
      const b2 = sheet(`<p>Added ${n} new word${n == 1 ? '' : 's'}.</p>${unknown.length ? `<p>Not in the dictionary:</p>${unknown.map(customForm).join('')}` : ''}<form method="dialog"><button class="plate">Done</button></form>`);
      b2.onsubmit = f => {
        const t = f.target;
        if (!t.matches('[data-line]')) return;
        f.preventDefault();
        const r = t.r.value.trim(), m = t.m.value.trim();
        if (addCustom({ r, w: t.w.value.trim(), m: m ? [m] : [] })) return void (t.outerHTML = `<p class="plate set muted">Added ${esc(r)}</p>`);
        const err = $('[data-err]', t); err.hidden = false; err.textContent = KANA.test(r) ? 'Add a meaning' : 'Reading must be kana';
      };
    };
  };
} };

export const grammar = { render: el => {
  stageHere();
  el.innerHTML = `<div class="screen setlist"><h1 class="plate">Grammar</h1>${GRAMMAR.map(p => db.cards[p.id]
    ? `<button class="plate set" style="align-self:stretch;text-align:left" data-open="${p.id}"><span><b lang="ja">${esc(p.title)}</b><br>${esc(p.en)}</span><span class="muted">Learned</span></button>`
    : `<div class="plate set muted"><span><b lang="ja">${esc(p.title)}</b><br>${esc(p.en)}<br><small>unlocks at ${p.words} words</small></span><span class="acts">${
      db.mine.grammar.includes(p.id) ? '<span>Next up</span>' : `<button data-pull="${p.id}">Learn next</button>`}</span></div>`).join('')}
    <div class="grow"></div>${nav('')}</div>`;
  el.onclick = e => {
    const o = e.target.closest('[data-open]'), b = e.target.closest('[data-pull]');
    if (o) wireHear(sheet(lessonHtml(GRAMMAR.find(p => p.id === o.dataset.open))));
    if (b) { addMine('grammar', b.dataset.pull); grammar.render(el); }
  };
} };
