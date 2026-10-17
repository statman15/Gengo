import { db, save } from './store.js';
import { dayKey, streak, weekReviews } from './streak.js';
import { isMastered } from './srs.js';

export const WORKER_URL = 'https://gengo.REPLACE.workers.dev';
const override = globalThis.location && new URLSearchParams(location.search).get('worker'); // ?worker=<url> for local testing
const base = () => override || WORKER_URL;
export const configured = () => !!override || !WORKER_URL.includes('REPLACE');
export const inviteUrl = () => `https://statman15.github.io/Gengo/#join=${db.settings.groupCode}`;

// Resolves to true when the Worker accepted our stats. Never throws: studying never depends on the network.
export async function postStats(f = globalThis.fetch) {
  const { name, deviceId, groupCode } = db.settings;
  if (!groupCode || !name || !configured()) return false;
  try {
    const now = new Date(), day = dayKey(now), r = db.race[day];
    const body = {
      name, streak: streak(db.days, now), week: weekReviews(db.days, now),
      mastered: Object.values(db.cards).filter(isMastered).length,
      station: 0, // Task 10
      race: r ? { day, time: r.time } : null,
    };
    return (await f(`${base()}/group/${groupCode}/${deviceId}`, { method: 'PUT', body: JSON.stringify(body) })).ok;
  } catch { return false; }
}

// The member records, or 'offline' on any failure.
export async function board(f = globalThis.fetch) {
  try {
    const res = await f(`${base()}/group/${db.settings.groupCode}`);
    return res.ok ? await res.json() : 'offline';
  } catch { return 'offline'; }
}

// Ask for a display name on the sheet (kept once saved). Resolves to the name, or null if dismissed.
async function askName() {
  if (db.settings.name) return db.settings.name;
  const { $, sheet } = await import('./ui.js');
  return new Promise(done => {
    const b = sheet(`<form><p>Your name for friends</p><input name="n" maxlength="20" required autocomplete="off" aria-label="Display name"><button class="plate">Save</button></form>`);
    $('#sheet').addEventListener('close', () => done(null), { once: true });
    $('form', b).onsubmit = e => {
      e.preventDefault();
      const n = e.target.n.value.trim().slice(0, 20);
      if (!n) return;
      db.settings.name = n; save(); done(n); $('#sheet').close();
    };
  });
}

// Resolves to the new group code, or null (dismissed or offline).
export async function createGroup(f = globalThis.fetch) {
  if (!configured() || !await askName()) return null;
  try {
    const res = await f(`${base()}/group`, { method: 'POST' });
    if (!res.ok) return null;
    db.settings.groupCode = (await res.json()).code; save();
    await postStats(f);
    return db.settings.groupCode;
  } catch { return null; }
}

// Handles #join=<code>: asks for a name, joins, and resolves true once the Worker accepts us.
export async function joinFromHash(f = globalThis.fetch) {
  const code = location.hash.match(/^#join=([a-z0-9]{4,32})$/i)?.[1];
  if (!code) return false;
  history.replaceState(null, '', location.pathname + location.search + '#friends');
  if (!configured() || !await askName()) return false;
  const prev = db.settings.groupCode;
  db.settings.groupCode = code;
  if (await postStats(f)) { save(); return true; }
  db.settings.groupCode = prev; // unknown, full or unreachable group: stay where we were
  return false;
}
