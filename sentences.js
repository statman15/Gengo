// Sentence library: loader, per-word and per-grammar-point indexes, readability and picking.
let loaded, byWord = {}, byPoint = {};

export const loadSentences = (fetchFn = fetch) => loaded ||= (async () => {
  try {
    const r = await fetchFn('data/sentences.json');
    const all = r.ok ? await r.json() : [];
    for (const s of all) {
      for (const [, , id] of s.t) if (id[0] === 'w') (byWord[id] ||= []).push(s);
      for (const g of s.g) (byPoint[g] ||= []).push(s);
    }
    return all;
  } catch { return []; }
})();

export const forWord = id => byWord[id] || [];
export const forPoint = id => byPoint[id] || [];
export const readable = (s, known) => s.t.every(([, , id]) => id[0] !== 'w' || known(id));
export function best(list, known, rand) {
  const n = s => s.t.filter(([, , id]) => id[0] === 'w' && known(id)).length;
  let top = [], max = -1;
  for (const s of list) { const k = n(s); if (k > max) [top, max] = [[s], k]; else if (k === max) top.push(s); }
  return top[Math.floor(rand() * top.length)] || null;
}

const HAN = /\p{Script=Han}/u;
// Reading of an inflected surface from its dictionary head+reading: stem reading + the kana left over.
export function tokenReading(surface, head, headReading) {
  if (!HAN.test(surface)) return surface;
  if (head === '来る') return null; // ponytail: irregular 来る stems dropped; add a stem table if too many sentences go
  const okuri = head.match(/[\p{Script=Hiragana}\p{Script=Katakana}ー]*$/u)[0], stem = head.slice(0, head.length - okuri.length);
  if (!HAN.test(stem) || !headReading.endsWith(okuri) || !surface.startsWith(stem)) return null;
  const rest = surface.slice(stem.length);
  return HAN.test(rest) ? null : headReading.slice(0, headReading.length - okuri.length) + rest;
}
