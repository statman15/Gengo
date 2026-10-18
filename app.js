import { $, esc, os, stage, nav, sheet } from './ui.js';
import { KANA } from './kana.js';
import { newCard, review, isMastered, TUNING, rungFor, pickRung, ratingFor } from './srs.js';
import { db, save } from './store.js';
import { dayKey } from './streak.js';
import { speak, canHear, canSay } from './speech.js';
import { dueQueue, nextNew } from './session.js';
import * as acts from './activities.js';
import { friends, raceView, homeFriends, stageHere } from './board.js';
import { postStats, joinFromHash, here } from './group.js';
import { settings, backupDue } from './settings.js';
import { STATIONS, printSrc, stationCost } from './journey.js';
import { checkUpdate } from './update.js';

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
  postStats();
  go('today');
}

const cartouche = i => `<div class="cartouche"><b>${STATIONS[i].jp}</b><small>${STATIONS[i].name} · ${i + 1} of 55</small></div>`;

// One-time "You reached <name>": the new print fades in over the old one, and a paper sheet names it.
function arrive(i) {
  const st = STATIONS[i], img = Object.assign(document.createElement('img'), { className: 'next', alt: '', src: printSrc(i) });
  db.settings.lastStation = i; save();
  img.style.objectPosition = st.focus;
  $('.stage').append(img);
  requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('in')));
  img.addEventListener('transitionend', () => { img.remove(); if (!$('.stage').classList.contains('recede')) stageHere(); }, { once: true });
  sheet(`<p lang="ja" style="font-family:var(--mincho);font-weight:800;font-size:1.9rem">${st.jp}</p><p>You reached ${st.name}</p><form method="dialog"><button class="plate">Continue</button></form>`);
}

// Small paper notes above the friends row: the backup nag, and (web only, once) how to add a Japanese voice on iPhone.
async function tips(el) {
  if (backupDue()) el.innerHTML = '<button class="plate tip" data-go="settings">Back up your progress</button>';
  if (db.settings.voiceTipShown || globalThis.Capacitor?.isNativePlatform?.() || await canHear() || !el.isConnected) return;
  db.settings.voiceTipShown = true; save();
  el.insertAdjacentHTML('beforeend', '<p class="plate tip">Add a Japanese voice so Gengo can speak: Settings → Accessibility → Spoken Content → Voices → Japanese.</p>');
}

// Views are modules exporting render(el, arg). Friends and nav targets other than today are Tasks 9-11.
const views = {
  today: { render: el => {
    const { station } = here(), last = Math.min(db.settings.lastStation, station), arriving = station > db.settings.lastStation;
    if (arriving) stage({ src: printSrc(last), focus: STATIONS[last].focus }); else stageHere();
    const due = dueQueue(db.cards, new Date()).length, n = nextNew(db.cards, db.settings.newBatch).length;
    el.innerHTML = `<div class="screen">
      ${cartouche(station)}
      <div class="grow"></div>
      ${due ? `<button class="seal" data-go="review" aria-label="${due} due. Start review"><b>${due}</b><span>始</span></button>`
        : '<button class="seal done" aria-label="Nothing due today"><b>0</b><span>済</span></button>'}
      ${!due && n ? `<div class="grow" style="flex:.25"></div><button class="plate" data-go="learn">Learn ${n} new kana?</button>` : ''}
      <div class="grow" style="flex:.5"></div>
      <div class="tips"></div>
      <div class="friends"></div>
      ${nav('today')}</div>`;
    homeFriends($('.friends', el));
    tips($('.tips', el));
    if (arriving) arrive(station);
  } },
  journey: { render: el => {
    const { station } = here(), mastered = Object.values(db.cards).filter(isMastered).length;
    stageHere();
    const row = (s, i) => `<li${i === station ? ' class="here" aria-current="step"' : ''}><span class="no">${i + 1}</span>
      <div class="info"><b lang="ja">${s.jp}</b> <span class="name">${s.name}</span><p class="scene">${s.scene}</p></div>
      <span class="state">${i < station ? '<i class="stamp" role="img" aria-label="Reached">済</i>' : i === station ? 'You are here' : `${stationCost(i) - mastered} more kana`}</span></li>`;
    el.innerHTML = `<div class="screen journey">${cartouche(station)}<div class="grow"></div>
      <div class="plate road"><ol>${STATIONS.map(row).join('')}</ol><p class="credit muted">Utagawa Hiroshige, Wikimedia Commons</p></div>
      <div class="grow" style="flex:.25"></div>${nav('journey')}</div>`;
    const road = $('.road', el), cur = $('.here', el);
    road.scrollTop = cur.offsetTop - (road.clientHeight - cur.offsetHeight) / 2;
  } },
  friends, race: raceView, settings,
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
    const can = r => r === 'hear' ? s.caps.canHear : r === 'say' ? s.caps.canSay : true;
    const L = TUNING.ladder.kana; // ponytail: kana only until words/grammar cards are queued
    const { rung, stretch } = s.fresh.has(id) ? { rung: rungFor(card, L, can), stretch: false } : pickRung(card, L, can, Math.random);
    el.innerHTML = `<div class="screen">${bars(i, s.queue.length)}</div>`;
    acts[rung]($('.screen', el), byId[id], r => {
      if (sess !== s || s.i !== i) return; // left the session or already answered
      db.cards[id] = review(card, ratingFor({ ...r, stretch, rung }), new Date());
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
const joined = () => location.hash.startsWith('#join=') ? joinFromHash().then(() => go('friends')) : 0;
addEventListener('hashchange', () => joined() || show(location.hash.slice(1)));
show(location.hash.startsWith('#join=') ? 'today' : location.hash.slice(1) || 'today');
joined();
postStats();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); // offline cache; optional
checkUpdate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
