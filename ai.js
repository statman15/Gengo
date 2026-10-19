// One OpenAI-compatible connection (OmniRoute, Gemini, or anything that speaks /chat/completions). Ported from HypertroPhy.
// Its settings live under their own localStorage key on this phone only: never in a backup, kept by Start over.
const KEY = 'gengo-ai';
const mem = {}; // node tests have no localStorage
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };

export const PRESETS = {
  omniroute: { label: 'OmniRoute', url: '', home: true, hint: 'Address: OmniRoute\'s Tailscale HTTPS address (works away from home with Tailscale on). Home address: its LAN address, tried first; works in the Android app, not the website.' },
  gemini: { label: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai', hint: 'Free key from aistudio.google.com → Get API key.' },
  other: { label: 'Other', url: '', home: true, hint: 'Any OpenAI-compatible address, ending in /v1.' },
};

// cfg = { preset, omniroute: {url,home,key,model,models}, gemini: {...}, other: {...} }: switching services keeps each one's key.
export const cfg = (() => { let c; try { c = JSON.parse(ls.getItem(KEY)); } catch {} c = c && typeof c === 'object' ? c : {};
  if (!PRESETS[c.preset]) c.preset = 'omniroute';
  for (const k in PRESETS) c[k] = { url: PRESETS[k].url, home: '', key: '', model: '', ...c[k] };
  return c; })();
export const saveAi = () => ls.setItem(KEY, JSON.stringify(cfg));
export const conn = () => cfg[cfg.preset];
export const ready = () => { const c = conn(); return !!((c.url || c.home) && c.key && c.model); };

const host = url => { try { return new URL(url).host; } catch { return url; } };
// A bare address (https://host:port) means the usual /v1; Gemini's longer path is left alone.
const base = url => { const u = url.trim().replace(/\/+$/, ''); try { return new URL(u).pathname === '/' ? u + '/v1' : u; } catch { return u; } };

// With a home address, use it when it answers within 2.5 s (any reply, even 401, means it's reachable), else the main address.
// Remembered for a minute so each request doesn't re-probe. On the website an http home address fails instantly.
let picked = { at: 0, key: '', url: '' };
async function address(c) {
  if (!c.home) return c.url;
  const key = c.home + c.url;
  if (picked.key === key && Date.now() - picked.at < 60000) return picked.url;
  let url = c.url || c.home; // no main address: try home anyway, so a dead home is "unreachable"
  try { await fetch(base(c.home) + '/models', { signal: AbortSignal.timeout(2500) }); url = c.home; } catch {} // no key on the probe: any reply means reachable
  picked = { at: Date.now(), key, url };
  return url;
}

// Which address answered the last request: '' (the main one), 'home', or 'Gemini' (fallback).
export let via = '';

async function call(path, body, c = conn()) {
  if (!(c.url || c.home) || !c.key) throw new Error('Set up the AI connection in Settings first.');
  const url = await address(c);
  let res;
  try {
    res = await fetch(base(url) + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${c.key}`, ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
  } catch (e) {
    if (e.name === 'TimeoutError') throw new Error('The AI took too long to answer. Try again.');
    picked.at = 0; // look for the home address again next time
    throw Object.assign(new Error(`Couldn't reach ${host(url)}. Check the address (it must start with https://), and for a Tailscale address that Tailscale is on.`), { unreachable: true });
  }
  if (res.status === 401 || res.status === 403) throw new Error('The AI service rejected the key. Check it in Settings.');
  if (!res.ok) throw new Error(`The AI service answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  via = url === c.home && c.home ? 'home' : '';
  return res.json();
}

export const models = async () => (await call('/models')).data.map(m => m.id.replace(/^models\//, ''))
  .filter(id => !/embed|imagen|veo|tts|aqa|vision|image/.test(id)).sort();

// When the chosen service can't be reached at all and a Gemini key is saved, Gemini answers instead.
export async function chat(messages) {
  const c = conn(), gem = cfg.gemini;
  let r;
  try { r = await call('/chat/completions', { model: c.model, messages }, c); }
  catch (e) {
    if (!e.unreachable || c === gem || !gem.key) throw e;
    r = await call('/chat/completions', { model: gem.model || 'gemini-2.5-flash', messages }, gem);
    via = 'Gemini';
  }
  const text = r.choices?.[0]?.message?.content;
  if (!text) throw new Error('The AI sent back an empty answer. Try again, or pick another model in Settings.');
  return text;
}

// The first {...} in a reply, parsed; models sometimes wrap JSON in prose or ``` fences.
export function json(text) {
  try { return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); }
  catch { throw new Error('The AI didn\'t send back a readable answer. Try again.'); }
}
