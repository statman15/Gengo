// Android app only: a banner when GitHub has a newer release. Checked on open and on return, at most every 6 hours.
// Update downloads the APK in-app and opens Android's installer over this one (same signing key, data kept); on any failure it opens the release page.
// The API response is untrusted: tag_name is only ever shown via textContent, and only an asset URL under our own releases is downloaded.
const $ = s => document.querySelector(s);

export const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); if ([...x, ...y].some(isNaN)) return false; for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

const REL = 'https://github.com/statman15/Gengo/releases/';
let checkedAt = 0;
export async function checkUpdate() {
  if (!globalThis.Capacitor?.isNativePlatform?.() || Date.now() - checkedAt < 6 * 3600e3) return;
  checkedAt = Date.now();
  try {
    const { version } = await (await fetch('version.json')).json();
    if (version === 'dev') return;
    const rel = await (await fetch('https://api.github.com/repos/statman15/Gengo/releases/latest')).json();
    const latest = String(rel.tag_name || '').replace(/^v/, ''), apk = rel.assets?.find(a => /\.apk$/.test(a.name) && String(a.browser_download_url).startsWith(`${REL}download/`))?.browser_download_url;
    if (!/^\d+\.\d+\.\d+$/.test(latest) || !apk || !newer(latest, version) || localStorage.getItem('skipUpdate') === latest) return;
    const text = $('#updateText'), go = $('#updateGo');
    text.textContent = `Update available: ${latest}`;
    go.onclick = async () => {
      const { Filesystem, FileOpener } = Capacitor.Plugins;
      go.disabled = true;
      text.textContent = `Downloading ${latest}…`;
      let prog;
      try {
        prog = await Filesystem.addListener('progress', p => { if (p.contentLength) text.textContent = `Downloading ${latest}… ${Math.round(100 * p.bytes / p.contentLength)}%`; });
        const r = await Filesystem.downloadFile({ url: apk, path: `Gengo-${latest}.apk`, directory: 'CACHE', progress: true, recursive: true });
        await FileOpener.open({ filePath: r.path, contentType: 'application/vnd.android.package-archive', openWithDefault: true });
        text.textContent = 'Follow the installer to update';
      } catch {
        text.textContent = "Couldn't download the update. Opening the release page…";
        location.href = `${REL}latest`;
      }
      prog?.remove();
      go.disabled = false;
    };
    $('#updateSkip').onclick = () => { localStorage.setItem('skipUpdate', latest); $('#update').hidden = true; };
    $('#update').hidden = false;
  } catch { checkedAt = 0; } // offline or rate-limited: try again next time
}
