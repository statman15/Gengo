const native = () => !!globalThis.Capacitor?.isNativePlatform?.();
const plugin = n => globalThis.Capacitor?.Plugins?.[n];
const synth = () => globalThis.speechSynthesis;
const LANG = 'ja-JP';

export const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

const norm = s => toHira(s).toLowerCase().trim().replace(/ー+$/, '').replace(/([あいうえおaiueo])\1+$/, '$1');
export const heardMatches = (alts, {kana, sound}) =>
  alts.some(a => { const n = norm(a); return n.startsWith(toHira(kana)) || n === sound; });

const bare = s => s.replace(/[\s\p{P}\p{S}]/gu, '');
export const heardWord = (alts, {r, w}) => alts.some(a => { const n = bare(a); return !!n && (n === w || toHira(n) === toHira(r)); });

export async function speak(text) {
  try {
    if (native()) return await plugin('TextToSpeech').speak({text, lang: LANG});
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG;
    await new Promise(r => { u.onend = u.onerror = r; synth().speak(u); });
  } catch {}
}

export async function canHear() {
  if (native()) return true;
  const s = synth();
  if (!s) return false;
  const has = () => s.getVoices().some(v => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  if (has()) return true;
  await new Promise(r => { s.addEventListener?.('voiceschanged', r, {once: true}); setTimeout(r, 1000); });
  return has();
}

export async function canSay() {
  try {
    const p = native() && plugin('SpeechRecognition');
    if (!p || !(await p.available()).available) return false;
    let r = await p.checkPermissions();
    if (r.speechRecognition !== 'granted') r = await p.requestPermissions();
    return r.speechRecognition === 'granted';
  } catch { return false; }
}

export async function listen() {
  try {
    const r = await plugin('SpeechRecognition').start({language: LANG, maxResults: 5, partialResults: false, popup: false});
    return r?.matches ?? [];
  } catch { return []; }
}
