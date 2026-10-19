import { esc } from './ui.js';
import { TUNING } from './srs.js';

const N = 16, NS = 'http://www.w3.org/2000/svg';

export function resample(pts, n) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  if (!len) return Array.from({ length: n }, () => [...pts[0]]);
  let j = 1;
  return Array.from({ length: n }, (_, k) => {
    const d = len * k / (n - 1);
    while (j < pts.length - 1 && cum[j] < d) j++;
    const t = (d - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
    return pts[j - 1].map((v, c) => v + (pts[j][c] - v) * t);
  });
}

export const strokeScore = (a, b) => a.reduce((s, p, i) => s + Math.hypot(p[0] - b[i][0], p[1] - b[i][1]), 0) / a.length;

// ctx unused
export function trace(el, item, done, ctx) {
  el.insertAdjacentHTML('beforeend', `<div class="plate card"><p class="prompt">Trace it, stroke by stroke</p><p class="gloss-big">${esc(item.m[0])}</p>` +
    `<svg viewBox="0 0 109 109" style="width:100%;max-width:300px;display:block;margin:auto;touch-action:none;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 15%,transparent);border-radius:12px"></svg></div>`);
  const svg = el.querySelector('svg'), t0 = Date.now(), tol = TUNING.traceTolerance ?? 18;
  const mk = (d, stroke, w, op = 1) => {
    const p = document.createElementNS(NS, d ? 'path' : 'polyline');
    for (const [k, v] of Object.entries({ fill: 'none', 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op })) p.setAttribute(k, v);
    p.style.stroke = stroke; // a style, not an attribute: var(--ink) only resolves in CSS
    if (d) p.setAttribute('d', d);
    svg.append(p);
    return p;
  };
  item.s.forEach(d => mk(d, 'currentColor', 3, .18));
  const expected = d => {
    const p = mk(d, 'none', 0), L = p.getTotalLength();
    const pts = Array.from({ length: N }, (_, k) => { const q = p.getPointAtLength(L * k / (N - 1)); return [q.x, q.y]; });
    p.remove();
    return pts;
  };
  let i = 0, miss = 0, hinted = false, drewIn = false, busy = false, drawn = null, live = null, over = false;
  const pt = e => { const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
  const next = (d, drawIn) => {
    i++; miss = 0;
    mk(d, 'var(--ink)', 4, drawIn ? .6 : 1);
    if (i < item.s.length) return;
    over = true;
    done({ correct: !drewIn, ms: Date.now() - t0, hinted });
  };
  svg.onpointerdown = e => {
    if (over || busy || drawn) return;
    svg.setPointerCapture(e.pointerId);
    drawn = [pt(e)];
    live = mk(null, 'var(--ink)', 3);
  };
  svg.onpointermove = e => {
    if (!drawn) return;
    drawn.push(pt(e));
    live.setAttribute('points', drawn.join(' '));
  };
  svg.onpointerup = () => {
    if (!drawn) return;
    const pts = drawn;
    drawn = null;
    live.remove();
    if (pts.length < 3 || over) return;
    const d = item.s[i];
    if (strokeScore(resample(pts, N), expected(d)) < tol) return next(d);
    hinted = true;
    const f = mk(d, 'var(--seal-text)', 4);
    busy = true;
    setTimeout(() => { f.remove(); busy = false; if (!over && ++miss >= 2) { drewIn = true; next(d, true); } }, 600);
  };
  svg.onpointercancel = () => { drawn = null; live?.remove(); };
}
