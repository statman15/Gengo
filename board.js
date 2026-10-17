import { $, esc, stage, nav } from './ui.js';
import { KANA } from './kana.js';
import { db, save } from './store.js';
import { dayKey } from './streak.js';
import { choices } from './session.js';
import { raceItems, raceTime } from './race.js';
import { board, configured, createGroup, inviteUrl, postStats, here } from './group.js';
import { STATIONS, printSrc } from './journey.js';

// The current station's print, filling in from sketch toward colour as the next station nears.
export const stageHere = (o = {}) => { const { station, progress } = here(); stage({ src: printSrc(station), focus: STATIONS[station].focus, sketch: 1 - progress, ...o }); };
const secs = ms => (ms / 1000).toFixed(1) + 's';
const byWeek = rows => [...rows].sort((a, b) => b.week - a.week);
const raced = () => db.race[dayKey(new Date())];
const plate = (text, go) => go ? `<button class="plate" data-go="${go}">${text}</button>` : `<div class="plate">${text}</div>`;

// The top three board rows (you included) for the home screen, or one plate linking to Friends.
export async function homeFriends(el) {
  if (!configured() || !db.settings.groupCode) return void (el.innerHTML = plate('Invite friends', 'friends'));
  const rows = await board();
  el.innerHTML = rows === 'offline' ? plate('Offline', 'friends')
    : byWeek(rows).slice(0, 3).map((r, i) => `<div class="plate${i ? '' : ' lead'}"><b>${r.streak}</b>${esc(r.name)}</div>`).join('');
}

const stationName = i => STATIONS[Math.min(Math.floor(i), STATIONS.length - 1)].name;
const row = (r, today) => `<div class="plate row"><span class="who">${esc(r.name)}<br><small class="muted">${stationName(r.station)}</small></span><b>🔥${r.streak}</b><span>${r.week} wk</span><span>${r.race?.day === today ? secs(r.race.time) : '–'}</span></div>`;

export const friends = { render: el => {
  stageHere();
  const code = db.settings.groupCode, r = raced();
  if (!configured()) return void (el.innerHTML = `<div class="screen"><div class="grow"></div>${plate("Group sync isn't set up yet")}<div class="grow"></div>${nav('friends')}</div>`);
  const seal = !code ? '<button class="seal" data-create aria-label="Create group"><b>＋</b><span>作</span></button>'
    : r ? `<button class="seal done" aria-label="Today's race done: ${secs(r.time)}"><b style="font-size:2rem">${secs(r.time)}</b><span>済</span></button>`
    : '<button class="seal" data-go="race" aria-label="Start today\'s kana race"><b>20</b><span>競</span></button>';
  el.innerHTML = `<div class="screen"><div class="boardrows">${code ? plate('Loading…') : ''}</div><div class="grow"></div>${seal}
    <div class="grow" style="flex:.25"></div>
    ${code ? '<button class="plate" data-share>Share Invite</button>' : plate('Friends join from your invite link.')}
    <div class="grow" style="flex:.5"></div>${nav('friends')}</div>`;
  if (!code) $('[data-create]', el).onclick = async () => { if (await createGroup()) friends.render(el); };
  else {
    const sh = $('[data-share]', el);
    sh.onclick = async () => {
      const url = inviteUrl();
      try { if (navigator.share) return await navigator.share({ url }); await navigator.clipboard.writeText(url); } catch { return; }
      sh.textContent = 'Copied'; setTimeout(() => { sh.textContent = 'Share Invite'; }, 1500);
    };
    postStats().then(() => board()).then(rows => {
      const today = dayKey(new Date());
      const t = $('.boardrows', el);
      if (!t?.isConnected) return;
      t.innerHTML = rows === 'offline' ? plate('Offline') : byWeek(rows).map(r => row(r, today)).join('');
    });
  }
} };

// A run is dropped (nothing saved) whenever the view is left; coming back starts over.
export const raceView = { render: el => {
  stage({ recede: true });
  if (raced()) return void (location.hash = 'friends');
  const today = dayKey(new Date()), items = raceItems(today), run = { i: 0, wrong: 0, t0: Date.now(), over: false };
  el.innerHTML = '<div class="screen"><div class="plate progress race-bar"></div><div class="racecard"></div></div>';
  const bar = $('.race-bar', el), cardEl = $('.racecard', el);
  const clock = () => secs(raceTime(Date.now() - run.t0, run.wrong));
  const tick = setInterval(() => {
    if (!bar.isConnected) return clearInterval(tick);
    $('.clock', bar).textContent = clock();
  }, 100);
  const draw = () => {
    const item = items[run.i], opts = choices(item, KANA, Math.random);
    bar.innerHTML = `<span>${run.i + 1}/${items.length}</span><b class="clock">${clock()}</b>`;
    cardEl.innerHTML = `<div class="plate card"><div class="kana" lang="ja">${item.kana}</div><p class="prompt">Which sound?</p></div>
      <div class="choices">${opts.map(o => `<button class="choice" data-id="${o.id}">${esc(o.sound)}</button>`).join('')}</div>`;
    $('.choices', cardEl).onclick = e => {
      const b = e.target.closest('[data-id]');
      if (!b || run.over) return;
      run.over = true;
      const ok = b.dataset.id === item.id;
      $(`[data-id="${item.id}"]`, cardEl).classList.add('right');
      if (!ok) { b.classList.add('wrong'); run.wrong++; }
      setTimeout(() => {
        if (!bar.isConnected) return;
        run.over = false;
        if (++run.i < items.length) return draw();
        clearInterval(tick);
        db.race[today] = { time: raceTime(Date.now() - run.t0, run.wrong) };
        save(); postStats();
        location.hash = 'friends';
      }, ok ? 400 : 900);
    };
  };
  draw();
} };
