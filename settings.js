import { $, esc, sheet, nav } from './ui.js';
import { db, save, exportJSON, importJSON } from './store.js';
import { dayKey } from './streak.js';
import { createGroup, configured, inviteUrl, postStats } from './group.js';
import { stageHere } from './board.js';

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

export const settings = { render: el => {
  stageHere();
  const { name, groupCode, newBatch } = db.settings, again = () => settings.render(el);
  el.innerHTML = `<div class="screen setlist">
    <h1 class="plate">Settings</h1>
    <label class="plate set">Name<input name="n" maxlength="20" value="${esc(name)}" placeholder="Your name" autocomplete="off" aria-label="Display name"></label>
    <div class="plate set"><span>Group${groupCode ? `<br><b class="code">${esc(groupCode)}</b>` : ''}</span><span class="acts">${
      groupCode ? '<button data-share>Share Invite</button><button data-leave>Leave Group</button>'
      : configured() ? '<button data-create>Create Group</button>' : '<span class="muted">Not set up yet</span>'}</span></div>
    <div class="plate set"><span>New kana per batch</span><div class="opts" role="group" aria-label="New kana per batch">${
      [3, 5, 8, 10].map(n => `<button data-batch="${n}" aria-pressed="${n === newBatch}">${n}</button>`).join('')}</div></div>
    <div class="plate set"><span>Backup</span><span class="acts"><button data-backup>Save Backup</button><button data-restore>Restore Backup</button><input type="file" class="vh" accept=".json,application/json" tabindex="-1" aria-hidden="true"></span></div>
    <div class="plate about muted"><p>Gengo <span class="ver">dev</span></p>
      <p>Prints by Utagawa Hiroshige, via Wikimedia Commons. Shippori Mincho B1 under the SIL Open Font License.</p>
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
  const create = $('[data-create]', el);
  if (create) create.onclick = async () => { if (await createGroup()) again(); };
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
