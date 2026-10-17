import { $ } from './ui.js';

// Views are modules exporting render(el, arg); only home exists so far (stub).
const views = {
  home: { render: el => { el.innerHTML = '<h1>Gengo</h1>'; } },
};

export function show(view, arg) {
  views[view].render($('#app'), arg);
}

show('home');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); // offline cache; optional
