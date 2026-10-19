import { $, esc, sheet, nav } from './ui.js';
import { db, save, exportJSON, importJSON, reset } from './store.js';
import { dayKey } from './streak.js';
import { createGroup, configured, inviteUrl, postStats, joinCode } from './group.js';
import { stageHere } from './board.js';
import { PRESETS, cfg, conn, saveAi, models, chat } from './ai.js';
import * as ai from './ai.js';

const DAY = 864e5;
const native = () => !!globalThis.Capacitor?.isNativePlatform?.();
// Home nags when there is progress that has never been backed up, or the last backup is over 14 days old.
export const backupDue = (s = db.settings, cards = db.cards, now = Date.now()) =>
  s.lastBackup == null ? Object.keys(cards).length > 0 : now - s.lastBackup > 14 * DAY;

const ok = msg => sheet(`<p>${esc(msg)}</p><form method="dialog"><button class="plate">OK</button></form>`);

// Share sheet where the phone has one, else a download. The Android WebView can't share files, so it writes then shares natively.
async function saveBackup() {
  const json = exportJSON(), name = `gengo-backup-${dayKey(new Date())}.json`;
  try {
    if (native()) {
      const { Filesystem, Share } = globalThis.Capacitor.Plugins;
      const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      await Share.share({ title: 'Gengo backup', files: [uri] });
    } else {
      const file = new File([json], name, { type: 'application/json' });
      let shared = false;
      if (navigator.canShare?.({ files: [file] })) try { await navigator.share({ files: [file], title: 'Gengo backup' }); shared = true; } catch (e) { if (e.name === 'AbortError') throw e; } // blocked share: download instead
      if (!shared) { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: name }); a.click(); URL.revokeObjectURL(a.href); }
    }
  } catch (e) {
    if (e.name === 'AbortError' || /cancel/i.test(e.message)) return false;
    ok(`Couldn't save the backup: ${e.message}`);
    return false;
  }
  db.settings.lastBackup = Date.now(); save();
  return true;
}

// Stories and Say/translate need an AI connection; the key stays on this phone (ai.js).
const aiPlate = () => { const c = conn(), p = PRESETS[cfg.preset], f = (k, label, ph, type = 'text') =>
  `<label class="set">${label}<input data-ai="${k}" type="${type}" value="${esc(c[k])}" placeholder="${ph}" autocapitalize="off" autocomplete="off" spellcheck="false"></label>`;
  return `<div class="plate ai"><div class="set"><span>AI</span><div class="opts" role="group" aria-label="AI service">${Object.entries(PRESETS).map(([k, x]) =>
    `<button data-preset="${k}" aria-pressed="${k === cfg.preset}">${x.label}</button>`).join('')}</div></div>
    <p class="muted">${esc(p.hint)}</p>
    ${f('url', 'Address', 'https://…/v1')}${p.home ? f('home', 'Home address', 'optional, http://…') : ''}${f('key', 'API key', '', 'password')}
    ${c.models?.length ? `<label class="set">Model<select data-ai="model">${[...new Set([c.model, ...c.models].filter(Boolean))].map(m =>
      `<option${m === c.model ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select></label>` : f('model', 'Model', 'Tap Test to list models')}
    <div class="set"><small class="muted" data-ai-msg role="status">The key is stored only on this phone.</small><span class="acts"><button data-test>Test Connection</button></span></div></div>`; };

export const settings = { render: el => {
  stageHere();
  const { name, groupCode, newBatch } = db.settings, again = () => settings.render(el);
  el.innerHTML = `<div class="screen setlist">
    <h1 class="plate">Settings</h1>
    <label class="plate set">Name<input name="n" maxlength="20" value="${esc(name)}" placeholder="Your name" autocomplete="off" aria-label="Display name"></label>
    <div class="plate set"><span>Group${groupCode ? `<br><b class="code">${esc(groupCode)}</b>` : ''}</span><span class="acts">${
      groupCode ? '<button data-share>Share Invite</button><button data-leave>Leave Group</button>'
      : configured() ? '<button data-create>Create Group</button><button data-join>Join Group</button>' : '<span class="muted">Not set up yet</span>'}</span></div>
    <div class="plate set"><span>New per batch</span><div class="opts" role="group" aria-label="New per batch">${
      [3, 5, 8, 10].map(n => `<button data-batch="${n}" aria-pressed="${n === newBatch}">${n}</button>`).join('')}</div></div>
    <div class="plate set"><span>Backup${backupDue() ? `<br><small class="muted">${db.settings.lastBackup == null ? 'Not backed up yet' : 'Last backup over 14 days ago'}</small>` : ''}</span><span class="acts"><button data-backup>Save Backup</button><button data-restore>Restore Backup</button><input type="file" class="vh" accept=".json,application/json" tabindex="-1" aria-hidden="true"></span></div>
    ${aiPlate()}
    <div class="plate set"><span>My words</span><span class="acts"><button data-go="words">Open</button></span></div>
    <div class="plate set"><span>Grammar</span><span class="acts"><button data-go="grammar">Open</button></span></div>
    <div class="plate set"><span>Kana chart</span><span class="acts"><button data-go="kana">Open</button></span></div>
    <div class="plate set"><span>Start over<br><small class="muted">Erase all progress on this phone</small></span><span class="acts"><button data-reset>Start Over</button></span></div>
    <div class="plate about muted"><p>Gengo <span class="ver">dev</span></p>
      <p>Prints by Utagawa Hiroshige, via Wikimedia Commons. Shippori Mincho B1 under the SIL Open Font License.</p>
      <p>Dictionary: JMdict (EDRDG, CC BY-SA 4.0). Sentences: Tatoeba (CC BY 2.0 FR). JLPT lists: Jonathan Waller (tanos.co.uk, CC BY). Kanji: KANJIDIC2 (EDRDG, CC BY-SA 4.0) and KanjiVG strokes (Ulrich Apel, CC BY-SA 3.0).</p>
      <p>Your study data stays on this phone.</p></div>
    <div class="grow"></div>${nav('settings')}</div>`;

  fetch('version.json').then(r => r.json()).then(v => { const s = $('.ver', el); if (s && v.version) s.textContent = v.version; }).catch(() => {});

  $('[name=n]', el).onchange = e => {
    const n = e.target.value.trim();
    if (n.length < 1 || n.length > 20) return void (e.target.value = db.settings.name);
    db.settings.name = n; save(); postStats();
  };
  el.querySelectorAll('[data-batch]').forEach(b => b.onclick = () => { db.settings.newBatch = +b.dataset.batch; save(); again(); });
  $('[data-backup]', el).onclick = async () => { if (await saveBackup()) ok('Backup saved'); };
  const file = $('input[type=file]', el);
  $('[data-restore]', el).onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files[0]; file.value = '';
    if (!f) return;
    const r = importJSON(await f.text());
    if (!r.ok) return ok(r.error);
    ok('Restored'); location.hash = 'today';
  };
  $('[data-reset]', el).onclick = () => {
    const b = sheet('<p>Erase all progress and start from the beginning? Your name and group stay. This can’t be undone unless you saved a backup.</p><button class="plate" data-yes>Start Over</button> <button class="plate" data-no>Cancel</button>');
    b.onclick = e => {
      if (e.target.closest('[data-yes]')) { reset(); postStats(); location.hash = 'today'; }
      if (e.target.closest('button')) $('#sheet').close();
    };
  };
  el.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { cfg.preset = b.dataset.preset; saveAi(); again(); });
  el.querySelectorAll('[data-ai]').forEach(i => i.onchange = () => { conn()[i.dataset.ai] = i.value.trim(); saveAi(); });
  // Test: fetch the model list (kept, so Model becomes a dropdown), pick one if none is set, then ask for a one-word reply.
  $('[data-test]', el).onclick = async () => {
    const say = t => { const m = $('[data-ai-msg]', el); if (m) m.textContent = t; };
    say('Connecting…');
    try {
      const list = await models(), c = conn();
      c.models = list;
      if (!c.model) c.model = list.find(m => /flash|auto/.test(m)) || list[0] || '';
      saveAi(); again(); say('Connecting…');
      await chat([{ role: 'user', content: 'Reply with the single word OK.' }]);
      say(`Connected${ai.via ? ` via ${ai.via === 'home' ? 'home address' : ai.via}` : ''} · ${c.model} · ${list.length} models`);
    } catch (e) { say(e.message); }
  };
  const create = $('[data-create]', el);
  if (create) create.onclick = async () => { if (await createGroup()) again(); };
  const join = $('[data-join]', el);
  if (join) join.onclick = () => {
    const b = sheet('<form><p>Paste the invite link or code</p><input name="c" autocomplete="off" aria-label="Invite link or code"><p class="muted" data-err hidden>No group code found in that.</p><button class="plate">Join Group</button></form>');
    $('form', b).onsubmit = e => {
      e.preventDefault();
      const code = joinCode(e.target.c.value);
      if (!code) return void ($('[data-err]', b).hidden = false);
      $('#sheet').close(); location.hash = 'join=' + code; // app.js hashchange runs the join flow
    };
  };
  const share = $('[data-share]', el);
  if (share) share.onclick = async () => {
    const url = inviteUrl();
    try { if (navigator.share) return await navigator.share({ url }); await navigator.clipboard.writeText(url); } catch { return; }
    share.textContent = 'Copied'; setTimeout(() => { share.textContent = 'Share Invite'; }, 1500);
  };
  const leave = $('[data-leave]', el);
  if (leave) leave.onclick = () => {
    const b = sheet('<p>Leave this group? Your progress stays on this phone.</p><button class="plate" data-yes>Leave Group</button> <button class="plate" data-no>Stay</button>');
    b.onclick = e => {
      if (e.target.closest('[data-yes]')) { db.settings.groupCode = ''; save(); again(); }
      if (e.target.closest('button')) $('#sheet').close();
    };
  };
} };
