import { $, esc, os, stage, nav, sheet, ruby } from './ui.js';
import { newCard, review, isMastered, isKnown, isDue, rungFor, pickRung, ratingFor } from './srs.js';
import { db, save } from './store.js';
import { dayKey } from './streak.js';
import { speak, canHear, canSay, listen } from './speech.js';
import { dueQueue, nextNew, dueSoon, practiceQueue } from './session.js';
import { budget, paceLine } from './pace.js';
import { TRACKS, trackOf, wordOrder } from './tracks.js';
import * as acts from './activities.js';
import { lessonHtml, ruleHtml, numberHtml, wireHear, canGrammar } from './grammar-acts.js';
import { ready, item, ladderFor, loadedWords, loadedKanji } from './items.js';
import { loadSentences } from './sentences.js';
import { friends, raceView, stageHere } from './board.js';
import { postStats, joinFromHash, here } from './group.js';
import { settings } from './settings.js';
import { STATIONS, READINGS, printSrc, stationCost } from './journey.js';
import { HINT } from './kana.js';
import { words, grammar, kana } from './lists.js';
import { checkUpdate } from './update.js';
import { coverage, fresh } from './coverage.js';
import { GRAMMAR } from './grammar.js';
import { MIN, storyWords, saved, keep, write } from './story.js';
import { ready as aiReady } from './ai.js';
import * as talk from './chat.js';
import { keypad } from './keypad.js';

document.documentElement.classList.add(os);

const bars = (done, total) => `<div class="plate progress">${'<i class="d"></i>'.repeat(done)}${'<i></i>'.repeat(total - done)}</div>`;
// A lesson's top bar: progress plus a close button back to Today (as well as the phone's back button). Graded cards stay graded.
const head = (done, total) => `<div class="sessionbar"><button class="plate x" data-go="today" aria-label="Close">✕</button>${bars(done, total)}</div>`;
const trk = () => trackOf(db.settings.track);
const newIds = (n = db.settings.newBatch) => nextNew(db.cards, n, { words: wordOrder(loadedWords(), trk()), mine: db.mine, kanji: loadedKanji(), track: trk() });
// New items still allowed today: the stage's daily pace, scaled by this week's accuracy, slowed when reviews pile up (pace.js).
const left = () => budget(db.cards, loadedWords(), db.days, new Date(), dayKey(new Date()), dueSoon(db.cards, new Date()), !!trk().travel);
// "5 kana", "3 words, a phrase and a grammar point": names what is in a new batch.
const batchName = ids => { const its = ids.map(item), n = k => its.filter(x => x.kind === k).length, s = k => n(k) > 1 ? 's' : '';
  return new Intl.ListFormat('en', { type: 'conjunction' }).format([n('kana') && `${n('kana')} kana`, n('rule') && 'a spelling rule', n('number') && 'a numbers lesson', n('phrase') && `${n('phrase') > 1 ? n('phrase') : 'a'} phrase${s('phrase')}`,
    n('word') && `${n('word')} word${s('word')}`, n('kanji') && `${n('kanji')} kanji`, its.some(x => x.kind === 'grammar') && 'a grammar point'].filter(Boolean)); };
const today = () => (db.days[dayKey(new Date())] ??= { reviews: 0, cleared: false });
// One graded review: counts toward today's reviews and this week's accuracy (rating 1 = wrong).
const tally = rating => { const d = today(); d.reviews++; d.graded = (d.graded ?? 0) + 1; if (rating > 1) d.right = (d.right ?? 0) + 1; };
// Today's story: the ids still to question (asked words that are still due), and whether Today offers it.
const storyLeft = s => s.ids.filter(id => !s.done.includes(id) && item(id) && db.cards[id] && isDue(db.cards[id], new Date()));
const storyOffer = () => { const s = saved(dayKey(new Date()));
  return s ? storyLeft(s).length > 0 : aiReady() && storyWords(dueQueue(db.cards, new Date())).length >= MIN; };
const storyLine = (l, markId) => l.segs.map(([t, id]) => id && (!markId || id === markId) ? `<mark>${esc(t)}</mark>` : esc(t)).join('');
// Today's chat: offered once MIN due words are free of today's story; stays on Today until it is graded.
const chatOffer = () => { const day = dayKey(new Date()), c = talk.saved(day);
  return c ? !c.applied : aiReady() && talk.chatWords(dueQueue(db.cards, new Date()), saved(day)?.ids).length >= talk.MIN; };
// Today's one-time question (new learners, and anyone from before tracks): which path. Settings can change it later.
const trackPicker = () => `<div class="plate tracks"><p>Choose your path. You can switch any time in Settings and keep everything.</p>${
  Object.entries(TRACKS).map(([k, t]) => `<button class="choice" data-track="${k}"><b>${t.name}</b><small>${t.short}</small></button>`).join('')}</div>`;
const go = v => location.hash === '#' + v ? show(v) : (location.hash = v);

// The live session ({view:'learn'|'review', ...}); show() drops it whenever the user leaves for another view.
let sess = null;

// Resolve what this device can do, then run the queue. learned = ids just learned: always the first rung, never stretched.
// practice: free practice while new items are paused; nothing is graded, so the schedule stays as FSRS set it.
async function begin(queue, learned = new Set(), practice = false) {
  const h = location.hash, caps = { canHear: await canHear(), canSay: await canSay() };
  await loadSentences();
  if (location.hash !== h) return; // user navigated away while capabilities resolved
  sess = { view: 'review', queue, fresh: learned, caps, i: 0, skipped: new Set(), practice };
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

const coveragePlate = () => { const c = cov(), p = x => Math.round(x * 100) + '%', pace = paceLine(db.cards, loadedWords(), db.days, new Date(), !!trk().travel);
  return `<div class="plate cov"><span class="wide">${esc(pace.text)}${pace.accuracy ? `<br><small>${esc(pace.accuracy)}</small>` : ''}</span><span>Hiragana <b>${p(c.hira)}</b></span><span>Katakana <b>${p(c.kata)}</b></span><span>N5 words <b>${p(c.n5)}</b></span><span>N4 words <b>${p(c.n4)}</b></span><span>Grammar <b>${Math.round(c.grammar * GRAMMAR.length)}/${GRAMMAR.length}</b></span>
<span class="wide">Sentences you can read <b>${p(c.library)}</b></span></div>`; };

// The station sheet on the Journey: the print, the name and what it shows, where you stand, and what a typical learner
// on your path learns on the road from here to the next station (data/journey-plan.json, from scripts/journey-plan.mjs).
let plan;
const loadPlan = () => plan ??= fetch('data/journey-plan.json').then(r => r.ok ? r.json() : null).catch(() => null);
const when = d => d == null ? '' : d < 1 ? 'from day one' : d < 70 ? `around week ${Math.max(1, Math.round(d / 7))}` : `around month ${Math.round(d / 30.4)}`;
async function stationSheet(i, here, mastered) {
  const s = STATIONS[i], next = STATIONS[i + 1], t = trk(), key = Object.keys(TRACKS).find(k => TRACKS[k] === t);
  const state = i < here ? 'Reached' : i === here ? 'You are here' : `${stationCost(i) - mastered} more mastered item${stationCost(i) - mastered === 1 ? '' : 's'} to reach it`;
  const body = sheet(`<div class="station"><img src="${printSrc(i)}" alt="" style="object-position:${s.focus}">
    <p class="st-name"><b lang="ja">${s.jp}</b> <span lang="ja">${READINGS[i]}</span></p>
    <p class="muted">${esc(s.name)} · station ${i + 1} of ${STATIONS.length} · ${state}</p>
    <p>${esc(s.scene)}.</p><div data-plan><p class="muted">…</p></div>
    <form method="dialog"><button class="plate">Close</button></form></div>`);
  const p = (await loadPlan())?.[key]?.[i], box = body.querySelector('[data-plan]');
  if (!box) return;
  if (!next) return void (box.innerHTML = `<h3>The end of the road</h3><p>Kyōto is where an average learner on the ${esc(t.name)} path finishes N4, ${when(p?.day ?? 365)}. Learning doesn't stop here: new words keep coming (N3 and beyond), and your reviews keep everything you know.</p>`);
  box.innerHTML = !p ? '' : `<h3>On the road to ${esc(next.name)}</h3>
    <p class="muted">What a typical learner on the ${esc(t.name)} path learns between here and the next station${p.day != null && i ? `, ${when(p.day)}` : ''}:</p>
    <ul>${p.learn.map(l => `<li lang="ja">${esc(l)}</li>`).join('') || '<li>Reviews: nothing new is planned on this stretch.</li>'}</ul>`;
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

// A small paper note above the nav (web only, once): how to add a Japanese voice on iPhone. The backup reminder lives in Settings.
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
    const due = dueQueue(db.cards, new Date()).length, room = left(), full = !due && room < 1, ids = full ? [] : newIds(Math.min(db.settings.newBatch, room));
    el.innerHTML = `<div class="screen">
      ${cartouche(station)}
      <div class="grow"></div>
      ${due ? `<button class="seal" data-go="review" aria-label="${due} due. Start review"><b>${due}</b><span>始</span></button>`
        : !db.settings.track ? '' : '<button class="seal done" aria-label="Nothing due today"><b>0</b><span>済</span></button>'}
      ${storyOffer() ? '<div class="grow" style="flex:.25"></div><button class="plate" data-go="story">Read today’s story</button>' : ''}
      ${chatOffer() ? `<div class="grow" style="flex:.25"></div><button class="plate" data-go="chat">${talk.saved(dayKey(new Date())) ? 'Continue today’s chat' : `Chat at ${STATIONS[station].jp}`}</button>` : ''}
      ${!db.settings.track ? trackPicker()
        : !due && ids.length ? `<div class="grow" style="flex:.25"></div><button class="plate" data-go="learn">Learn ${batchName(ids)}?</button>` : ''}
      ${full && db.settings.track ? '<div class="grow" style="flex:.25"></div><p class="plate tip">That’s everything new for today. Learning a little each day sticks better than a lot at once. Keep practising what you’ve learned, or come back tomorrow.</p><button class="plate" data-go="practice">Keep practising</button>' : ''}
      <div class="grow" style="flex:.5"></div>
      <div class="tips"></div>
      ${nav('today')}</div>`;
    el.querySelectorAll('[data-track]').forEach(b => b.onclick = () => { db.settings.track = b.dataset.track; save(); show('today'); });
    tips($('.tips', el));
    if (arriving) arrive(station); else if (ended) milestone();
    ended = false;
  } },
  journey: { render: el => {
    const { station } = here(), mastered = Object.values(db.cards).filter(isMastered).length;
    stageHere();
    const row = (s, i) => `<li${i === station ? ' class="here" aria-current="step"' : ''} data-station="${i}" role="button" tabindex="0" aria-label="${s.name}: details"><span class="no">${i + 1}</span>
      <div class="info"><b lang="ja">${s.jp}</b> <span class="name">${s.name}</span><p class="scene">${s.scene}</p></div>
      <span class="state">${i < station ? '<i class="stamp" role="img" aria-label="Reached">済</i>' : i === station ? 'You are here' : `${stationCost(i) - mastered} more`}</span></li>`;
    el.innerHTML = `<div class="screen journey">${cartouche(station)}<div class="grow"></div>
      <div class="plate road"><ol>${STATIONS.map(row).join('')}</ol><p class="credit muted">Utagawa Hiroshige, Wikimedia Commons</p></div>
      ${coveragePlate()}
      <div class="friends"><button class="plate" data-go="words">My words</button><button class="plate" data-go="grammar">Grammar</button><button class="plate" data-go="kana">Kana</button></div>
      <div class="grow" style="flex:.25"></div>${nav('journey')}</div>`;
    const road = $('.road', el), cur = $('.here', el);
    road.scrollTop = cur.offsetTop - (road.clientHeight - cur.offsetHeight) / 2;
    const open = li => li && stationSheet(+li.dataset.station, station, mastered);
    road.onclick = e => open(e.target.closest('[data-station]'));
    road.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e.target.closest('[data-station]')); } };
  } },
  friends, race: raceView, settings, words, grammar, kana,
  // Intro plate per new kana (tap to hear), then all of them go straight into a hear review.
  learn: { render: el => {
    stage({ recede: true });
    if (!sess && (dueQueue(db.cards, new Date()).length || !db.settings.track)) return go('today'); // reviews first, and a track chosen, as Today asks
    const s = sess ??= { view: 'learn', ids: left() > 0 ? newIds(Math.min(db.settings.newBatch, left())) : [], i: 0 };
    if (!s.ids.length) return go('today');
    const it = item(s.ids[s.i]), last = s.i === s.ids.length - 1, has = x => !!db.cards[x];
    const rd = a => [...new Set(a.map(x => x.replace(/[-.]/g, '')))].join('・'), uses = it.kind === 'kanji' ? acts.kanjiWords(it, has).slice(0, 3) : [];
    const say = it.kana ?? it.r ?? uses[0]?.r ?? acts.kanjiReading(it); // a kanji speaks as your word that uses it
    const face = it.kind === 'grammar' ? `<div class="plate card">${lessonHtml(it)}</div>`
      : it.kind === 'rule' ? `<div class="plate card">${ruleHtml(it)}</div>`
      : it.kind === 'number' ? `<div class="plate card">${numberHtml(it)}</div>`
      : it.kind === 'phrase' ? `<button class="plate card" data-hear aria-label="Hear ${esc(it.m[0])}">${acts.phraseFace(it, { has })}<p class="gloss-big">${esc(it.m[0])}</p><p class="prompt">Tap to hear it</p></button>`
      : it.kind === 'kanji' ? `<button class="plate card" data-hear aria-label="Hear ${esc(it.m[0])}"><div class="kana" lang="ja">${esc(it.k)}</div><p class="gloss-big">${esc(it.m.join(' · '))}</p>
        ${it.on.length ? `<p class="prompt">On <span lang="ja">${esc(rd(it.on))}</span></p>` : ''}${it.kun.length ? `<p class="prompt">Kun <span lang="ja">${esc(rd(it.kun))}</span></p>` : ''}
        ${uses.map(x => `<p class="prompt"><span lang="ja">${ruby(x.w, x.r, true)}</span> ${esc(x.m[0])}</p>`).join('')}<p class="prompt">Tap to hear it</p></button>`
      : `<button class="plate card" data-hear aria-label="Hear ${esc(it.sound ?? it.m[0])}">${it.kind === 'kana' ? `<div class="kana" lang="ja">${it.kana}</div><p class="gloss-big">${esc(it.sound)}</p>${HINT[it.kana] ? `<p class="prompt">${esc(HINT[it.kana])}</p>` : ''}`
        : `<div class="kana word" lang="ja">${ruby(it.w, it.r, true)}</div><p class="gloss-big">${esc(it.m[0])}</p>${it.m.length > 1 ? `<p class="prompt">${esc(it.m.slice(1, 3).join(' · '))}</p>` : ''}`}<p class="prompt">Tap to hear it</p></button>`;
    el.innerHTML = `<div class="screen">${head(s.i + 1, s.ids.length)}${face}
      <div class="grow"></div>
      <button class="seal" data-next aria-label="${last ? 'Start review' : 'Next'}"><b>${s.i + 1}/${s.ids.length}</b><span>${last ? '始' : '次'}</span></button>
      <div class="grow" style="flex:.4"></div></div>`;
    if (['grammar', 'rule', 'number'].includes(it.kind)) wireHear($('.card', el)); else $('[data-hear]', el).onclick = () => speak(say);
    $('[data-next]', el).onclick = () => {
      if (!last) { s.i++; return show('learn'); }
      const now = new Date();
      for (const id of s.ids) db.cards[id] = newCard(now);
      today().learned = (today().learned ?? 0) + s.ids.length;
      save();
      begin(s.ids, new Set(s.ids));
    };
    if (!['grammar', 'rule', 'number'].includes(it.kind)) speak(say);
  } },
  // Free practice of recent and weak cards while new items are paused (see budget in pace.js).
  practice: { render: () => { stage({ recede: true }); begin(practiceQueue(db.cards, new Date()), new Set(), true); } },
  // The story, then one meaning question per marked word that is still due; each answer is that word's review.
  story: { render: el => {
    stage({ recede: true });
    const day = dayKey(new Date()), s = saved(day), back = '<button class="plate" data-go="today">Back</button>';
    if (!s) {
      const ids = storyWords(dueQueue(db.cards, new Date()));
      if (ids.length < MIN) return go('today');
      el.innerHTML = `<div class="screen"><div class="plate card"><p class="prompt">Writing today’s story…</p><p class="prompt">This can take up to a minute on a free AI key.</p></div></div>`;
      write(day, ids, db.cards, STATIONS[here().station]).then(() => location.hash === '#story' && show('story'), e => {
        if (location.hash !== '#story') return;
        el.innerHTML = `<div class="screen"><div class="plate card"><p class="prompt">${esc(e.message)}</p></div><div class="grow"></div><button class="plate" data-retry>Try again</button>${back}</div>`;
        $('[data-retry]', el).onclick = () => show('story');
      });
      return;
    }
    const left = storyLeft(s);
    el.innerHTML = `<div class="screen"><div class="plate card sentence story"><h2>${esc(s.title)}</h2>${s.lines.map((l, i) =>
      `<p lang="ja" data-line="${i}">${storyLine(l)}</p><p class="prompt en" hidden>${esc(l.en)}</p>`).join('')}
      <button class="hint" data-en>Show English</button></div><div class="grow"></div>
      ${left.length ? `<button class="plate" data-ask>Answer ${left.length} question${left.length > 1 ? 's' : ''}</button>` : back}</div>`;
    $('.story', el).onclick = e => { const l = e.target.closest('[data-line]'); if (l) speak(s.lines[l.dataset.line].jp); };
    $('[data-en]', el).onclick = e => { e.stopPropagation(); el.querySelectorAll('.story .en').forEach(p => p.hidden = !p.hidden); };
    const known = x => !!db.cards[x] && isKnown(db.cards[x]);
    const ask = () => {
      const id = storyLeft(s)[0];
      if (!id) { save(); postStats(); return go('today'); }
      const l = s.lines.find(l => l.segs.some(g => g[1] === id));
      el.innerHTML = `<div class="screen">${head(s.done.length, s.ids.length)}</div>`;
      acts.meaning($('.screen', el), item(id), `<div class="plate card sentence"><p lang="ja">${storyLine(l, id)}</p><p class="prompt">What does the marked word mean?</p><p class="prompt en" hidden>${esc(l.en)}</p></div>`, r => {
        const rating = ratingFor({ ...r, rung: 'read' });
        db.cards[id] = review(db.cards[id], rating, new Date());
        tally(rating); s.done.push(id); keep(s); save();
        setTimeout(() => { if (location.hash === '#story') ask(); }, r.correct ? 600 : 1200);
      }, { known }, () => el.querySelector('.en').hidden = false);
    };
    const a = $('[data-ask]', el);
    if (a) a.onclick = ask;
  } },
  // Today's chat: the AI's lines (tap to hear, Show English), your replies typed or spoken, then the AI grades each due word.
  chat: { render: el => {
    stage({ recede: true });
    const day = dayKey(new Date());
    let c = talk.saved(day);
    if (!c) {
      const ids = talk.chatWords(dueQueue(db.cards, new Date()), saved(day)?.ids), { jp, name, scene } = STATIONS[here().station];
      if (ids.length < talk.MIN) return go('today');
      talk.keep(c = { day, ids, station: { jp, name, scene }, log: [] });
    }
    const words = c.ids.map(item).filter(Boolean), aiTurn = () => !c.grade && (!c.log.length || c.log.at(-1).me);
    let helped = false, canTalk = false;
    const draw = () => {
      if (location.hash !== '#chat') return;
      const g = c.grade, mark = { right: '✓', wrong: '✗', no: '–' };
      el.innerHTML = `<div class="screen"><div class="plate card chat">
        <p class="prompt">At ${esc(c.station.jp)}${c.who ? ` · ${esc(c.who)}` : ''}</p>
        <p class="prompt">Try to use: ${words.map(w => `<span lang="ja">${ruby(w.w, w.r, true)}</span> ${esc(w.m[0])}`).join(' · ')}</p>
        ${c.log.map((l, i) => l.me ? `<p class="me" lang="ja">${esc(l.jp)}</p>` : `<p lang="ja" data-line="${i}">${esc(l.jp)}</p><p class="prompt en" hidden>${esc(l.en)}</p>`).join('')}
        <p class="prompt" data-out role="status">${aiTurn() ? (talk.replies(c) >= talk.TURNS ? 'Checking your words…' : '…') : ''}</p>
        ${g ? `<div class="result">${words.map(w => `<p>${mark[g.words[w.id]?.used ?? 'no']} <span lang="ja">${esc(w.r)}</span> ${esc(w.m[0])}</p>`).join('')}
          ${g.fixes.map(f => `<p><span lang="ja">${esc(c.log.filter(l => l.me)[f.reply - 1]?.jp ?? '')}</span> → <span lang="ja">${esc(f.fix)}</span><br><small>${esc(f.why)}</small></p>`).join('')}
          <p>${esc(g.note)}</p></div>` : ''}
        ${c.log.length ? '<button class="hint" data-en>Show English</button>' : ''}</div>
        ${g ? '<div class="grow"></div><button class="plate" data-go="today">Done</button>'
        : aiTurn() ? '' : `<input class="answer" lang="ja" aria-label="Your reply in Japanese" placeholder="日本語で" autocomplete="off" autocapitalize="off" spellcheck="false">
        <div class="choices">${canTalk ? '<button class="choice" data-speak>Speak</button>' : ''}<button class="choice" data-suggest>Suggest</button><button class="choice" data-send>Send</button></div>`}</div>`;
      $('.chat', el).onclick = e => { const l = e.target.closest('[data-line]'); if (l) speak(c.log[l.dataset.line].jp); };
      const en = $('[data-en]', el);
      if (en) en.onclick = e => { e.stopPropagation(); el.querySelectorAll('.chat .en').forEach(p => p.hidden = !p.hidden); };
      const input = $('.answer', el);
      if (!input) return;
      keypad(input);
      const send = () => { const jp = input.value.trim(); if (!jp) return; c.log.push({ me: true, jp, ...(helped && { helped }) }); helped = false; talk.keep(c); step(); };
      input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) send(); };
      $('[data-send]', el).onclick = send;
      $('[data-suggest]', el).onclick = () => { const h = c.log.at(-1)?.hint; if (h) { input.value = h; helped = true; } input.focus(); };
      const sp = $('[data-speak]', el);
      if (sp) sp.onclick = async () => { const o = $('[data-out]', el); o.textContent = 'Listening…'; const h = (await listen())[0]; o.textContent = ''; if (h) input.value = h; };
      input.focus(); // Android opens the keyboard; iPhone only does on a tap
      input.scrollIntoView({ block: 'center' });
    };
    // The AI's next line (or the grade), then apply the grade once: each word still due gets its review.
    const step = () => {
      draw();
      if (!aiTurn()) return;
      talk.next(c, db.cards).then(() => {
        c = talk.saved(day) ?? c; // the request may have updated the copy an earlier visit held
        if (c.grade && !c.applied) {
          const now = new Date();
          for (const id of c.ids) { const r = talk.rating(c.grade.words[id], c.log), card = db.cards[id];
            if (r && card && isDue(card, now)) { db.cards[id] = review(card, r, now); tally(r); } }
          c.applied = true; talk.keep(c); save(); postStats();
        }
        draw();
      }).catch(e => {
        if (location.hash !== '#chat') return;
        const o = $('[data-out]', el); o.innerHTML = `${esc(e.message)}<br><button class="hint" data-retry>Try again</button>`;
        $('[data-retry]', el).onclick = step;
      });
    };
    step();
    canSay().then(ok => { if (ok && location.hash === '#chat') { canTalk = true; if (!aiTurn() && !c.grade && !$('.answer', el)?.value) draw(); } });
  } },
  review: { render: el => {
    stage({ recede: true });
    if (!sess) return void begin(dueQueue(db.cards, new Date()));
    const s = sess;
    if (s.i >= s.queue.length) return finish(s);
    const i = s.i, id = s.queue[i], card = db.cards[id], it = item(id);
    const can = it.kind === 'word' ? acts.canWord(it, s.caps) : it.kind === 'grammar' ? canGrammar(it, db.cards) : r => r === 'hear' ? s.caps.canHear : r === 'say' ? s.caps.canSay : true;
    let { rung, stretch } = s.fresh.has(id) ? { rung: rungFor(card, ladderFor(it), can), stretch: false } : pickRung(card, ladderFor(it), can, Math.random);
    // Conversation leans on listening: a reading drill on a word or phrase becomes a listening one about half the time.
    if (!s.fresh.has(id) && (it.kind === 'word' || it.kind === 'phrase') && ['see', 'read', 'tiles'].includes(rung) && can('hear') && Math.random() < trk().listen) [rung, stretch] = ['hear', false];
    if (!rung) { s.skipped.add(id); s.i++; return show('review'); } // nothing this card can do on this device: skip, ungraded
    el.innerHTML = `<div class="screen">${head(i, s.queue.length)}</div>`;
    const known = x => !!db.cards[x] && isKnown(db.cards[x]);
    (it.kind === 'kana' ? acts : acts.ACTS[it.kind])[rung]($('.screen', el), it, r => {
      if (sess !== s || s.i !== i) return; // left the session or already answered
      if (!s.practice) { const rating = ratingFor({ ...r, stretch, rung }); db.cards[id] = review(card, rating, new Date()); tally(rating); }
      save(); // graded now, so leaving during the pause loses nothing
      setTimeout(() => { if (sess === s && s.i === i) { s.i++; show('review'); } }, r.correct && !r.speechFallback ? 600 : 1200);
    }, { known, has: x => !!db.cards[x], caps: s.caps });
  } },
};

export function show(view, arg) {
  if (!views[view]) { if (view) history.replaceState(null, '', '#today'); view = 'today'; } // unknown link: a real Today, nav included
  if (sess && sess.view !== view) sess = null;
  views[view].render($('#app'), arg);
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
