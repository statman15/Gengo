export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// Furigana. Kanji words get a <ruby>; the reading is hidden by CSS unless show (the word isn't known yet) or tapped (a peek).
const HAN = /\p{Script=Han}/u;
export const ruby = (w, r, show) => !r || !HAN.test(w) ? esc(w) : `<ruby${show ? ' class="on"' : ''}>${esc(w)}<rt>${esc(r)}</rt></ruby>`;
// s.t = [[surface, reading, id]...]; show(id) says whether a word segment shows its reading; markId's word is wrapped in <mark>.
export const sentenceHtml = (s, markId, show) => s.t.map(([sf, r, id]) => {
  const h = id[0] === 'w' ? ruby(sf, r, show(id)) : esc(sf);
  return id && id === markId ? `<mark>${h}</mark>` : h;
}).join('');

// One bottom sheet, reused by every screen.
export function sheet(html) {
  const d = $('#sheet');
  $('#sheetBody').innerHTML = html;
  $('#sheetBody').onclick = $('#sheetBody').onchange = null; // drop the last sheet's handlers
  if (!d.open) d.showModal();
  d.scrollTop = 0;
  return $('#sheetBody');
}

// Which phone chrome to draw: iOS conventions on Apple devices, Material everywhere else.
export const os = new URLSearchParams(globalThis.location?.search).get('os') || // ?os=ios|android previews the other phone's chrome
  (/iPhone|iPad|Macintosh/.test(globalThis.navigator?.userAgent) && !globalThis.Capacitor?.isNativePlatform?.() ? 'ios' : 'android');

// The print behind every screen. sketch: 1 = ink sketch, 0 = full colour.
export function stage({ src, focus = '50% 50%', sketch = 0, recede = false } = {}) {
  const img = $('#print'), root = document.documentElement.style;
  if (src && !img.src.endsWith(src)) { img.src = src; img.onload = () => tintFrom(img); }
  else if (img.complete) tintFrom(img);
  root.setProperty('--focus', focus);
  root.setProperty('--sketch', Math.max(0, Math.min(1, sketch)));
  $('.stage').classList.toggle('recede', recede);
}

// Sample the print's sky (top 15%) and use it as the tint for OS controls.
export function tintFrom(img) {
  try {
    const c = document.createElement('canvas'), w = (c.width = 32), h = (c.height = 6), x = c.getContext('2d');
    x.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight * .15, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4, k = 0.62; // darken so white labels on the tint stay readable
    const hex = [r, g, b].map(v => Math.round(v / n * k).toString(16).padStart(2, '0')).join('');
    document.documentElement.style.setProperty('--tint', '#' + hex);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#' + hex);
  } catch { /* tainted or not loaded: keep the fallback tint */ }
}

const ICONS = {
  today: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 12h6M12 9v6"/>',
  journey: '<path d="M4 20c4-1 5-5 8-8s5-6 8-8"/><path d="M4 8h6M7 5v6M15 16h5M17.5 13.5v5"/>',
  friends: '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10.5" r="2.5"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14.5 15.2c2.4-.4 4.6.9 5.5 3.8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
};
const TABS = [['today', 'Today'], ['journey', 'Journey'], ['friends', 'Friends'], ['settings', 'Settings']];

// The bottom navigation, drawn in each OS's own grammar by CSS (html.ios / html.android).
export const nav = current => `<nav class="nav">${TABS.map(([id, label]) =>
  `<a href="#${id}" data-view="${id}"${id === current ? ' aria-current="page"' : ''}><span class="ind"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg></span>${label}</a>`).join('')}</nav>`;
