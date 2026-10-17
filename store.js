import { KANA } from './kana.js';

const KEY = 'gengo';
const mem = {}; // node tests have no localStorage
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };

const DATE = ['due', 'last_review'];
const NUM = ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses', 'state'];
const day = v => v >= 0 && Number.isFinite(v); // finite, non-negative number
const date = v => { const d = new Date(v); return v != null && !isNaN(d) ? d : null; };
// Card ids must be known kana for M1; M2 widens this one check.
const KNOWN = new Set(KANA.map(k => k.id));
const knownId = id => KNOWN.has(id);

function card(c) {
  if (!c || typeof c !== 'object' || !NUM.every(k => Number.isFinite(c[k]))) return null;
  const due = date(c.due), last = c.last_review == null ? undefined : date(c.last_review);
  if (!due || last === null) return null;
  const out = Object.fromEntries(NUM.map(k => [k, c[k]]));
  return { ...out, due, ...(last && { last_review: last }) };
}

const SETTINGS = { name: ['string', ''], deviceId: ['string', ''], groupCode: ['string', ''], lastBackup: ['number', null], newBatch: ['number', 5] };
// revive is pure: raw (parsed JSON or anything) in, a clean db out.
export function revive(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}, ent = o => Object.entries(o && typeof o === 'object' ? o : {});
  const settings = {};
  for (const [k, [type, def]] of Object.entries(SETTINGS)) {
    const v = r.settings?.[k];
    settings[k] = typeof v === type && (type !== 'number' || Number.isFinite(v)) ? v : def;
  }
  return {
    settings,
    cards: Object.fromEntries(ent(r.cards).filter(([id]) => knownId(id)).map(([id, c]) => [id, card(c)]).filter(([, c]) => c)),
    days: Object.fromEntries(ent(r.days).filter(([, d]) => day(d?.reviews) && typeof d.cleared === 'boolean').map(([k, d]) => [k, { reviews: d.reviews, cleared: d.cleared }])),
    race: Object.fromEntries(ent(r.race).filter(([, d]) => day(d?.time)).map(([k, d]) => [k, { time: d.time }])),
  };
}

export const db = (() => { try { return revive(JSON.parse(ls.getItem(KEY))); } catch { return revive(null); } })();
export const save = () => ls.setItem(KEY, JSON.stringify(db));
if (!db.settings.deviceId) { db.settings.deviceId = crypto.randomUUID(); save(); }

export const exportJSON = () => JSON.stringify(db);

export function importJSON(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'That file is not valid JSON.' }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'That file is not a Gengo backup.' };
  const next = revive(raw), { deviceId, groupCode } = db.settings;
  Object.assign(db, next, { settings: { ...next.settings, deviceId, groupCode } }); // in place: importers hold the live db
  save();
  return { ok: true };
}
