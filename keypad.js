// An in-app kana keypad: a web page can't pick the phone's keyboard language, so Japanese replies get their own keys.
// Phone layout (columns あかさ…わ, vowels down), ゛゜小 cycles the last kana, カナ switches script, ⌨ hands back to the phone's keyboard.
const ROWS = ['あかさたなはまやらわ', 'いきしちにひみ り ', 'うくすつぬふむゆるを', 'えけせてねへめ れー', 'おこそとのほもよろん'];
const CYCLES = ['かが', 'きぎ', 'くぐ', 'けげ', 'こご', 'さざ', 'しじ', 'すず', 'せぜ', 'そぞ', 'ただ', 'ちぢ', 'つっづ', 'てで', 'とど',
  'はばぱ', 'ひびぴ', 'ふぶぷ', 'へべぺ', 'ほぼぽ', 'あぁ', 'いぃ', 'うぅ', 'えぇ', 'おぉ', 'やゃ', 'ゆゅ', 'よょ', 'わゎ'];
const kata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
// The next form of the last kana: か→が→か, は→ば→ぱ→は, つ→っ→づ→つ, や→ゃ→や (hiragana or katakana).
export function cycle(c) {
  for (const s of CYCLES) for (const x of [s, kata(s)]) { const i = x.indexOf(c); if (i >= 0) return x[(i + 1) % x.length]; }
  return c;
}

export function keypad(input) {
  let k = false;
  const box = document.createElement('div');
  box.className = 'keypad'; box.lang = 'ja';
  const draw = () => box.innerHTML = ROWS.map(r => [...r].map(c => c === ' ' ? '<i></i>' : `<button data-k="${k ? kata(c) : c}">${k ? kata(c) : c}</button>`).join('')).join('') +
    `<button class="wide" data-kana>${k ? 'かな' : 'カナ'}</button><button class="wide" data-mod aria-label="Add or remove ゛ ゜ or make small">゛゜小</button>` +
    '、。？！'.split('').map(c => `<button data-k="${c}">${c}</button>`).join('') + '<button data-del aria-label="Delete">⌫</button><button data-os aria-label="Use the phone keyboard">⌨</button>';
  const put = v => { input.value = v; input.dispatchEvent(new Event('input')); };
  box.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    if (b.dataset.k) put(input.value + b.dataset.k);
    else if (b.hasAttribute('data-del')) put([...input.value].slice(0, -1).join(''));
    else if (b.hasAttribute('data-mod') && input.value) put(input.value.slice(0, -1) + cycle(input.value.at(-1)));
    else if (b.hasAttribute('data-kana')) { k = !k; draw(); }
    else if (b.hasAttribute('data-os')) { input.inputMode = 'text'; box.hidden = true; input.blur(); input.focus(); }
  };
  input.inputMode = 'none'; // keep the phone's keyboard closed while the keypad is up
  draw();
  input.after(box);
  return box;
}
