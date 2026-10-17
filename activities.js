import { KANA } from './kana.js';
import { speak, listen, heardMatches } from './speech.js';
import { choices } from './session.js';
import { esc } from './ui.js';

// Each activity appends its card (and choices) to el, then calls done({correct, ms, hinted, speechFallback}) once, at the moment of answer.
// The caller owns the pause before the next item.
function quiz(el, item, card, text, kanaChoice, replay, done) {
  const opts = choices(item, KANA, Math.random);
  el.insertAdjacentHTML('beforeend', `${card}<div class="choices">${opts.map(o =>
    `<button class="choice${kanaChoice ? ' kana-choice' : ''}" data-id="${o.id}"${kanaChoice ? ' lang="ja"' : ''}>${esc(text(o))}</button>`).join('')}</div>`);
  const box = el.querySelector('.choices'), t0 = Date.now();
  let hinted = false, over = false;
  if (replay) el.querySelector('[data-replay]').onclick = () => { hinted = true; speak(item.kana); };
  box.onclick = e => {
    const b = e.target.closest('[data-id]');
    if (!b || over) return;
    over = true;
    const correct = b.dataset.id === item.id;
    box.querySelector(`[data-id="${item.id}"]`).classList.add('right');
    if (!correct) b.classList.add('wrong');
    done({ correct, ms: Date.now() - t0, hinted });
  };
}

// Never await speak(): it has no timeout and iOS may not fire onend.
export function hear(el, item, done) {
  speak(item.kana);
  quiz(el, item, '<button class="plate card" data-replay aria-label="Play the sound again"><p class="prompt">Which kana did you hear?</p><p class="prompt">Tap to hear it again</p></button>',
    o => o.kana, true, true, done);
}

export function see(el, item, done) {
  quiz(el, item, `<div class="plate card"><div class="kana" lang="ja">${item.kana}</div><p class="prompt">Which sound?</p></div>`,
    o => o.sound, false, false, done);
}

export function say(el, item, done) {
  el.insertAdjacentHTML('beforeend', `<div class="plate card"><div class="kana" lang="ja">${item.kana}</div><p class="prompt">Say it aloud</p></div>`);
  const prompt = el.querySelector('.prompt'), t0 = Date.now();
  (async () => {
    for (let miss = 0; miss < 2; miss++) {
      if (heardMatches(await listen(), item)) return done({ correct: true, ms: Date.now() - t0, hinted: false });
      if (!el.isConnected) return; // left the session while listening
      if (!miss) prompt.textContent = 'Try once more';
    }
    prompt.textContent = item.sound;
    speak(item.kana);
    done({ correct: true, ms: Date.now() - t0, hinted: true, speechFallback: true });
  })();
}
