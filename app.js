import { $, esc, os, stage, nav } from './ui.js';
import { KANA } from './kana.js';
import { newCard, review, rungFor, pickRung, ratingFor } from './srs.js';
import { db, save } from './store.js';
import { dayKey } from './streak.js';
import { speak, canHear, canSay } from './speech.js';
import { dueQueue, nextNew } from './session.js';
import * as acts from './activities.js';

document.documentElement.classList.add(os);

const byId = Object.fromEntries(KANA.map(k => [k.id, k]));
const bars = (done, total) => `<div class="plate progress">${'<i class="d"></i>'.repeat(done)}${'<i></i>'.repeat(total - done)}</div>`;
const today = () => (db.days[dayKey(new Date())] ??= { reviews: 0, cleared: false });
const go = v => location.hash === '#' + v ? show(v) : (location.hash = v);

// The live session ({view:'learn'|'review', ...}); show() drops it whenever the user leaves for another view.
let sess = null;

// Resolve what this device can do, then run the queue. fresh = ids just learned: always the first rung, never stretched.
async function begin(queue, fresh = new Set()) {
  const h = location.hash, caps = { canHear: await canHear(), canSay: await canSay() };
  if (location.hash !== h) return; // user navigated away while capabilities resolved
  sess = { view: 'review', queue, fresh, caps, i: 0 };
  go('review');
}

function finish(s) {
  if (s.queue.length && !dueQueue(db.cards, new Date()).length) today().cleared = true;
  save();
  go('today');
}

// Views are modules exporting render(el, arg). Friends and nav targets other than today are Tasks 9-11.
const views = {
  today: { render: el => {
    stage({ src: 'prints/00.jpg', focus: '40% 50%', sketch: 0.35 });
    const due = dueQueue(db.cards, new Date()).length, n = db.settings.newBatch;
    el.innerHTML = `<div class="screen">
      <div class="cartouche"><b>日本橋</b><small>Nihonbashi · 1 of 55</small></div>
      <div class="grow"></div>
      ${due ? `<button class="seal" data-go="review" aria-label="${due} due. Start review"><b>${due}</b><span>始</span></button>`
        : '<button class="seal done" aria-label="Nothing due today"><b>0</b><span>済</span></button>'}
      ${nextNew(db.cards, n).length ? `<div class="grow" style="flex:.25"></div><button class="plate" data-go="learn">Learn ${n} new kana?</button>` : ''}
      <div class="grow" style="flex:.5"></div>
      <div class="friends">${[['Chris', 12, true], ['Bro', 4], ['Sam', 27]].map(([n, s, lead]) => // Task 9
        `<div class="plate${lead ? ' lead' : ''}"><b>${s}</b>${esc(n)}</div>`).join('')}</div>
      ${nav('today')}</div>`;
  } },
  // Intro plate per new kana (tap to hear), then all of them go straight into a hear review.
  learn: { render: el => {
    stage({ recede: true });
    const s = sess ??= { view: 'learn', ids: nextNew(db.cards, db.settings.newBatch), i: 0 };
    if (!s.ids.length) return go('today');
    const item = byId[s.ids[s.i]], last = s.i === s.ids.length - 1;
    el.innerHTML = `<div class="screen">${bars(s.i + 1, s.ids.length)}
      <button class="plate card" data-hear aria-label="Hear ${esc(item.sound)}"><div class="kana" lang="ja">${item.kana}</div>
        <p class="prompt">${esc(item.sound)}</p><p class="prompt">Tap to hear it</p></button>
      <div class="grow"></div>
      <button class="seal" data-next aria-label="${last ? 'Start review' : 'Next kana'}"><b>${s.i + 1}/${s.ids.length}</b><span>${last ? '始' : '次'}</span></button>
      <div class="grow" style="flex:.4"></div></div>`;
    $('[data-hear]', el).onclick = () => speak(item.kana);
    $('[data-next]', el).onclick = () => {
      if (!last) { s.i++; return show('learn'); }
      const now = new Date();
      for (const id of s.ids) db.cards[id] = newCard(now);
      save();
      begin(s.ids, new Set(s.ids));
    };
    speak(item.kana);
  } },
  review: { render: el => {
    stage({ recede: true });
    if (!sess) return void begin(dueQueue(db.cards, new Date()));
    const s = sess;
    if (s.i >= s.queue.length) return finish(s);
    const i = s.i, id = s.queue[i], card = db.cards[id];
    const { rung, stretch } = s.fresh.has(id) ? { rung: rungFor(card, s.caps), stretch: false } : pickRung(card, s.caps, Math.random);
    el.innerHTML = `<div class="screen">${bars(i, s.queue.length)}</div>`;
    acts[rung]($('.screen', el), byId[id], r => {
      if (sess !== s || s.i !== i) return; // left the session or already answered
      db.cards[id] = review(card, ratingFor({ ...r, stretch }), new Date());
      today().reviews++;
      save(); // graded now, so leaving during the pause loses nothing
      setTimeout(() => { if (sess === s && s.i === i) { s.i++; show('review'); } }, r.correct && !r.speechFallback ? 600 : 1200);
    });
  } },
};

export function show(view, arg) {
  if (sess && sess.view !== view) sess = null;
  (views[view] || views.today).render($('#app'), arg);
}

$('#app').addEventListener('click', e => { const t = e.target.closest('[data-go]'); if (t) go(t.dataset.go); });
addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1) || 'today');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); // offline cache; optional
