import { KANA } from './kana.js';
import { GRAMMAR } from './grammar.js';
import { RULES } from './rules.js';
import { PHRASES } from './phrases.js';

const KEY = 'gengo';
const mem = {}; // node tests have no localStorage
const ls = globalThis.localStorage ?? { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };

const DATE = ['due', 'last_review'];
const NUM = ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses', 'state'];
const day = v => v >= 0 && Number.isFinite(v); // finite, non-negative number
const date = v => { const d = new Date(v); return v != null && !isNaN(d) ? d : null; };
// Card ids: known kana, spelling rules and phrases, word ids (checked against words.json later, by the queue), known grammar ids, custom ids with an entry.
const KNOWN = new Set([...KANA, ...RULES, ...PHRASES].map(k => k.id)), GIDS = new Set(GRAMMAR.map(g => g.id));
const wordId = id => /^w-\d+$/.test(id), grammarId = id => /^g-[a-z-]+$/.test(id) && GIDS.has(id);
const strs = a => [...new Set((Array.isArray(a) ? a : []).filter(x => typeof x === 'string'))];
const KANAONLY = /^[ぁ-ゖァ-ヺー]+$/;
const str = (v, max) => typeof v === 'string' && v.length <= max;
function custom(e) {
  if (!e || typeof e !== 'object' || typeof e.r !== 'string' || !KANAONLY.test(e.r) || !Array.isArray(e.m)) return null;
  const m = e.m.slice(0, 3);
  if (!m.length || !m.every(x => typeof x === 'string' && x && x.length <= 80)) return null;
  return { r: e.r, w: str(e.w, 20) ? e.w : '', m };
}

function card(c) {
  if (!c || typeof c !== 'object' || !NUM.every(k => Number.isFinite(c[k]))) return null;
  const due = date(c.due), last = c.last_review == null ? undefined : date(c.last_review);
  if (!due || last === null) return null;
  const out = Object.fromEntries(NUM.map(k => [k, c[k]]));
  return { ...out, due, ...(last && { last_review: last }) };
}

const SETTINGS = { name: ['string', ''], deviceId: ['string', ''], groupCode: ['string', ''], lastBackup: ['number', null], newBatch: ['number', 5], lastStation: ['number', 0], voiceTipShown: ['boolean', false] };
// revive is pure: raw (parsed JSON or anything) in, a clean db out.
export function revive(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}, ent = o => Object.entries(o && typeof o === 'object' ? o : {});
  const settings = {};
  for (const [k, [type, def]] of Object.entries(SETTINGS)) {
    const v = r.settings?.[k];
    settings[k] = typeof v === type && (type !== 'number' || Number.isFinite(v)) ? v : def;
  }
  const ls = settings.lastStation; // a station index: integer 0..54
  if (!Number.isInteger(ls) || ls < 0 || ls > 54) settings.lastStation = Math.max(0, Math.min(54, Math.floor(ls)));
  if (![3, 5, 8, 10].includes(settings.newBatch)) settings.newBatch = 5;
  const cust = Object.fromEntries(ent(r.custom).filter(([id]) => /^c-\d+$/.test(id)).map(([id, e]) => [id, custom(e)]).filter(([, e]) => e));
  const knownId = id => KNOWN.has(id) || wordId(id) || /^k-\p{Script=Han}$/u.test(id) || grammarId(id) || (/^c-\d+$/.test(id) && Object.hasOwn(cust, id));
  const mine = { words: strs(r.mine?.words).filter(id => wordId(id) || Object.hasOwn(cust, id)), grammar: strs(r.mine?.grammar).filter(grammarId) };
  return {
    settings, custom: cust, mine, seen: strs(r.seen),
    cards: Object.fromEntries(ent(r.cards).filter(([id]) => knownId(id)).map(([id, c]) => [id, card(c)]).filter(([, c]) => c)),
    days: Object.fromEntries(ent(r.days).filter(([, d]) => day(d?.reviews) && typeof d.cleared === 'boolean').map(([k, d]) => [k, { reviews: d.reviews, cleared: d.cleared }])),
    race: Object.fromEntries(ent(r.race).filter(([, d]) => day(d?.time)).map(([k, d]) => [k, { time: d.time }])),
  };
}

// Unreadable saved progress is kept under gengo-unreadable before a fresh db replaces it, so it can still be recovered by hand.
export const db = (() => { try { return revive(JSON.parse(ls.getItem(KEY))); } catch { try { ls.setItem(KEY + '-unreadable', ls.getItem(KEY)); } catch {} return revive(null); } })();
export const save = () => ls.setItem(KEY, JSON.stringify(db));
if (!db.settings.deviceId) { db.settings.deviceId = crypto.randomUUID(); save(); }

export const exportJSON = () => JSON.stringify(db);

export function importJSON(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'That file is not valid JSON.' }; }
  const obj = o => !!o && typeof o === 'object' && !Array.isArray(o);
  if (!obj(raw) || !(obj(raw.cards) || obj(raw.settings))) return { ok: false, error: 'That file is not a Gengo backup.' };
  const next = revive(raw), { deviceId, groupCode } = db.settings;
  // in place: importers hold the live db. A new phone (no group yet) takes the backup's group.
  Object.assign(db, next, { settings: { ...next.settings, deviceId, groupCode: groupCode || next.settings.groupCode } });
  save(); dropDaily();
  return { ok: true };
}

// Today's story and chat belong to the old progress (their words may be gone): drop them on Start over and Restore.
const dropDaily = () => { try { ['gengo-story', 'gengo-chat'].forEach(k => globalThis.localStorage?.removeItem(k)); } catch {} };

// Start over: a fresh db that keeps only who this is (name, device, group).
export function reset() {
  const { name, deviceId, groupCode } = db.settings;
  Object.assign(db, revive({ settings: { name, deviceId, groupCode } }));
  save(); dropDaily();
}

// false when already listed or already learning.
export function addMine(kind, id) {
  if (db.mine[kind].includes(id) || Object.hasOwn(db.cards, id)) return false;
  db.mine[kind].push(id); save();
  return true;
}

export function addCustom(e) {
  const c = custom(e);
  if (!c) return null;
  const id = 'c-' + (Math.max(0, ...Object.keys(db.custom).map(k => +k.slice(2))) + 1);
  db.custom[id] = c; db.mine.words.push(id); save();
  return id;
}

// One entry per non-blank line, matched exactly on written form or reading; capped at 500 lines.
export function parseList(text, words) {
  const found = [], unknown = [];
  for (const line of String(text).split(/\r?\n/).slice(0, 500)) {
    const t = line.trim();
    if (!t) continue;
    const x = words.find(w => w.w === t || w.r === t) ?? Object.entries(db.custom).map(([id, c]) => ({ id, ...c })).find(w => w.w === t || w.r === t);
    if (!x) { if (!unknown.includes(t)) unknown.push(t); } else if (!found.includes(x)) found.push(x);
  }
  return { found, unknown };
}
