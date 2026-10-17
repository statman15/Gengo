import { $, esc, os, stage, nav } from './ui.js';

document.documentElement.classList.add(os);

// Views are modules exporting render(el, arg). Home and review are design stubs with sample data;
// Tasks 7-11 replace the sample data with the store, session, journey and group modules.
const views = {
  today: { render: el => {
    stage({ src: 'prints/00.jpg', focus: '40% 50%', sketch: 0.35 });
    el.innerHTML = `<div class="screen">
      <div class="cartouche"><b>日本橋</b><small>Nihonbashi · 1 of 55</small></div>
      <div class="grow"></div>
      <button class="seal" data-go="review" aria-label="23 due. Start review"><b>23</b><span>始</span></button>
      <div class="grow" style="flex:.5"></div>
      <div class="friends">${[['Chris', 12, true], ['Bro', 4], ['Sam', 27]].map(([n, s, lead]) =>
        `<div class="plate${lead ? ' lead' : ''}"><b>${s}</b>${esc(n)}</div>`).join('')}</div>
      ${nav('today')}</div>`;
  } },
  review: { render: el => {
    stage({ recede: true });
    el.innerHTML = `<div class="screen">
      <div class="plate progress">${'<i class="d"></i>'.repeat(6)}${'<i></i>'.repeat(4)}</div>
      <div class="plate card"><div class="kana" lang="ja">ぬ</div><p class="prompt">Which sound?</p></div>
      <div class="choices">${['me', 'nu', 'ne', 'wa'].map(s => `<button class="choice${s === 'nu' ? ' right' : ''}">${s}</button>`).join('')}</div>
    </div>`;
  } },
};

export function show(view, arg) {
  (views[view] || views.today).render($('#app'), arg);
}

$('#app').addEventListener('click', e => { const t = e.target.closest('[data-go]'); if (t) show(t.dataset.go); });
addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1) || 'today');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); // offline cache; optional
