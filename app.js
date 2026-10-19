import { $, esc, os, stage, nav, sheet, ruby } from './ui.js';
import { newCard, review, isMastered, isKnown, rungFor, pickRung, ratingFor } from './srs.js';
import { db, save } from './store.js';
import { dayKey } from './streak.js';
import { speak, canHear, canSay } from './speech.js';
import { dueQueue, nextNew } from './session.js';
import * as acts from './activities.js';
import { lessonHtml, wireHear, canGrammar } from './grammar-acts.js';
import { ready, item, ladderFor, loadedWords } from './items.js';
import { loadSentences } from './sentences.js';
import { friends, raceView, homeFriends, stageHere } from './board.js';
import { postStats, joinFromHash, here } from './group.js';
import { settings } from './settings.js';
import { STATIONS, printSrc, stationCost } from './journey.js';
import { words, grammar, kana } from './lists.js';
import { checkUpdate } from './update.js';
import { coverage, fresh } from './coverage.js';
import { GRAMMAR } from './grammar.js';

document.documentElement.classList.add(os);

const bars = (done, total) => `<div class="plate progress">${'<i class="d"></i>'.repeat(done)}${'<i></i>'.repeat(total - done)}</div>`;
const newIds = () => nextNew(db.cards, db.settings.newBatch, { words: loadedWords(), mine: db.mine });
// "5 kana", "3 words and は": names what is in a new batch.
const batchName = ids => { const its = ids.map(item), n = k => its.filter(x => x.kind === k).length;
  return new Intl.ListFormat('en', { type: 'conjunction' }).format([n('kana') && `${n('kana')} kana`, n('word') && `${n('word')} word${n('word') > 1 ? 's' : ''}`, its.some(x => x.kind === 'grammar') && 'a grammar point'].filter(Boolean)); };
const today = () => (db.days[dayKey(new Date())] ??= { reviews: 0, cleared: false });
const go = v => location.hash === '#' + v ? show(v) : (location.hash = v);

// The live session ({view:'learn'|'review', ...}); show() drops it whenever the user leaves for another view.
let sess = null;

// Resolve what this device can do, then run the queue. learned = ids just learned: always the first rung, never stretched.
async function begin(queue, learned = new Set()) {
  const h = location.hash, caps = { canHear: await canHear(), canSay: await canSay() };
  await loadSentences();
  if (location.hash !== h) return; // user navigated away while capabilities resolved
  sess = { view: 'review', queue, fresh: learned, caps, i: 0, skipped: new Set() };
  go('review');
}

let lib = [], ended = false; // lib: all sentences, for coverage; ended: a session just finished
loadSentences().then(a => lib = a);
const cov = () => coverage(db.cards, loadedWords(), lib);

// One-time milestone sheet: shows the newest fresh one; marks all fresh as seen so a backlog doesn't chain sheets.
function milestone() {
  const f = fresh(cov(), db.seen);
  if (!f.length) return;
  db.seen.push(...f.map(m => m.id)); save();
  sheet(`<p>${f.at(-1).label}</p><form method="dialog"><button class="plate">Continue</button></form>`);
}

function finish(s) {
  ended = true;
  if (s.queue.length && !dueQueue(db.cards, new Date()).some(id => !s.skipped.has(id))) today().cleared = true;
  save();
  postStats();
  go('today');
}

const coveragePlate = () => { const c = cov(), p = x => Math.round(x * 100) + '%';
  return `<div class="plate cov"><span>Hiragana <b>${p(c.hira)}</b></span><span>Katakana <b>${p(c.kata)}</b></span><span>N5 words <b>${p(c.n5)}</b></span><span>N4 words <b>${p(c.n4)}</b></span><span>Grammar <b>${Math.round(c.grammar * GRAMMAR.length)}/${GRAMMAR.length}</b></span>
<span class="wide">Sentences you can read <b>${p(c.library)}</b></span></div>`; };

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

// A small paper note above the friends row (web only, once): how to add a Japanese voice on iPhone. The backup reminder lives in Settings.
async function tips(el) {
  if (db.settings.voiceTipShown || globalThis.Capacitor?.isNativePlatform?.() || await canHear() || !el.isConnected) return;
  db.settings.voiceTipShown = true; save();
  el.insertAdjacentHTML('beforeend', '<p class="plate tip">Add a Japanese voice so Gengo can speak: Settings → Accessibility → Spoken Content → Voices → Japanese.</p>');
}

// Views are modules exporting render(el, arg). Friends and nav targets other than today are Tasks 9-11.
const views = {
  today: { render: el => {
    const { station } = here(), last = Math.min(db.settings.lastStation, station), arriving = station > db.settings.lastStation;
    if (arriving) stage({ src: printSrc(last), focus: STATIONS[last].focus }); else stageHere();
    const due = dueQueue(db.cards, new Date()).length, ids = newIds();
    el.innerHTML = `<div class="screen">
      ${cartouche(station)}
      <div class="grow"></div>
      ${due ? `<button class="seal" data-go="review" aria-label="${due} due. Start review"><b>${due}</b><span>始</span></button>`
        : '<button class="seal done" aria-label="Nothing due today"><b>0</b><span>済</span></button>'}
      ${!due && ids.length ? `<div class="grow" style="flex:.25"></div><button class="plate" data-go="learn">Learn ${batchName(ids)}?</button>` : ''}
      <div class="grow" style="flex:.5"></div>
      <div class="tips"></div>
      <div class="friends"></div>
      ${nav('today')}</div>`;
    homeFriends($('.friends', el));
    tips($('.tips', el));
    if (arriving) arrive(station); else if (ended) milestone();
    ended = false;
  } },
  journey: { render: el => {
    const { station } = here(), mastered = Object.values(db.cards).filter(isMastered).length;
    stageHere();
    const row = (s, i) => `<li${i === station ? ' class="here" aria-current="step"' : ''}><span class="no">${i + 1}</span>
      <div class="info"><b lang="ja">${s.jp}</b> <span class="name">${s.name}</span><p class="scene">${s.scene}</p></div>
      <span class="state">${i < station ? '<i class="stamp" role="img" aria-label="Reached">済</i>' : i === station ? 'You are here' : `${stationCost(i) - mastered} more`}</span></li>`;
    el.innerHTML = `<div class="screen journey">${cartouche(station)}<div class="grow"></div>
      <div class="plate road"><ol>${STATIONS.map(row).join('')}</ol><p class="credit muted">Utagawa Hiroshige, Wikimedia Commons</p></div>
      ${coveragePlate()}
      <div class="friends"><button class="plate" data-go="words">My words</button><button class="plate" data-go="grammar">Grammar</button></div>
      <div class="grow" style="flex:.25"></div>${nav('journey')}</div>`;
    const road = $('.road', el), cur = $('.here', el);
    road.scrollTop = cur.offsetTop - (road.clientHeight - cur.offsetHeight) / 2;
  } },
  friends, race: raceView, settings, words, grammar, kana,
  // Intro plate per new kana (tap to hear), then all of them go straight into a hear review.
  learn: { render: el => {
    stage({ recede: true });
    const s = sess ??= { view: 'learn', ids: newIds(), i: 0 };
    if (!s.ids.length) return go('today');
    const it = item(s.ids[s.i]), last = s.i === s.ids.length - 1, say = it.kana ?? it.r;
    const face = it.kind === 'grammar' ? `<div class="plate card">${lessonHtml(it)}</div>`
      : `<button class="plate card" data-hear aria-label="Hear ${esc(it.sound ?? it.m[0])}">${it.kind === 'kana' ? `<div class="kana" lang="ja">${it.kana}</div><p class="gloss-big">${esc(it.sound)}</p>`
        : `<div class="kana word" lang="ja">${ruby(it.w, it.r, true)}</div><p class="gloss-big">${esc(it.m[0])}</p>${it.m.length > 1 ? `<p class="prompt">${esc(it.m.slice(1, 3).join(' · '))}</p>` : ''}`}<p class="prompt">Tap to hear it</p></button>`;
    el.innerHTML = `<div class="screen">${bars(s.i + 1, s.ids.length)}${face}
      <div class="grow"></div>
      <button class="seal" data-next aria-label="${last ? 'Start review' : 'Next'}"><b>${s.i + 1}/${s.ids.length}</b><span>${last ? '始' : '次'}</span></button>
      <div class="grow" style="flex:.4"></div></div>`;
    if (it.kind === 'grammar') wireHear($('.card', el)); else $('[data-hear]', el).onclick = () => speak(say);
    $('[data-next]', el).onclick = () => {
      if (!last) { s.i++; return show('learn'); }
      const now = new Date();
      for (const id of s.ids) db.cards[id] = newCard(now);
      save();
      begin(s.ids, new Set(s.ids));
    };
    if (it.kind !== 'grammar') speak(say);
  } },
  review: { render: el => {
    stage({ recede: true });
    if (!sess) return void begin(dueQueue(db.cards, new Date()));
    const s = sess;
    if (s.i >= s.queue.length) return finish(s);
    const i = s.i, id = s.queue[i], card = db.cards[id], it = item(id);
    const can = it.kind === 'word' ? acts.canWord(it, s.caps) : it.kind === 'grammar' ? canGrammar(it, db.cards) : r => r === 'hear' ? s.caps.canHear : r === 'say' ? s.caps.canSay : true;
    const { rung, stretch } = s.fresh.has(id) ? { rung: rungFor(card, ladderFor(it), can), stretch: false } : pickRung(card, ladderFor(it), can, Math.random);
    if (!rung) { s.skipped.add(id); s.i++; return show('review'); } // nothing this card can do on this device: skip, ungraded
    el.innerHTML = `<div class="screen">${bars(i, s.queue.length)}</div>`;
    const known = x => !!db.cards[x] && isKnown(db.cards[x]);
    (it.kind === 'kana' ? acts : acts.ACTS[it.kind])[rung]($('.screen', el), it, r => {
      if (sess !== s || s.i !== i) return; // left the session or already answered
      db.cards[id] = review(card, ratingFor({ ...r, stretch, rung }), new Date());
      today().reviews++;
      save(); // graded now, so leaving during the pause loses nothing
      setTimeout(() => { if (sess === s && s.i === i) { s.i++; show('review'); } }, r.correct && !r.speechFallback ? 600 : 1200);
    }, { known });
  } },
};

export function show(view, arg) {
  if (sess && sess.view !== view) sess = null;
  (views[view] || views.today).render($('#app'), arg);
}

$('#app').addEventListener('click', e => { const t = e.target.closest('[data-go]'); if (t) go(t.dataset.go); });
const joined = () => location.hash.startsWith('#join=') ? joinFromHash().then(() => go('friends')) : 0;
addEventListener('hashchange', () => joined() || show(location.hash.slice(1)));
const loaded = ready(); // words.json; never rejects, offline leaves kana only
const slow = await Promise.race([loaded.then(() => false), new Promise(r => setTimeout(r, 4000, true))]); // don't hold the first screen for a slow download
show(location.hash.startsWith('#join=') ? 'today' : location.hash.slice(1) || 'today');
joined();
loaded.then(() => { if (slow && !location.hash.slice(1).replace(/^today$/, '')) show('today'); }); // slow load: refresh Today if still there
postStats();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); // offline cache; optional
checkUpdate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
