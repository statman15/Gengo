// "Does the app start?" gate: serves the repo root, loads it in headless Chrome, fails on any JS or load error.
// Usage: node smoke.mjs [dir]   (dir defaults to "."). Chrome: $CHROME_PATH or a standard install.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = join(process.cwd(), process.argv[2] || '.');
const types = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.svg': 'image/svg+xml' };
const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p));
if (!chrome) { console.error('FAIL: no Chrome found. Set CHROME_PATH.'); process.exit(1); }

const server = http.createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body);
}).listen(0);
await new Promise(r => server.once('listening', r));
const origin = `http://localhost:${server.address().port}`;

const errors = [];
const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
let step = 'launch';
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(5000);
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(`console.error: ${m.text()}`));
  page.on('requestfailed', r => r.url().startsWith(origin) && errors.push(`failed request: ${r.url()}`));
  page.on('response', r => r.url().startsWith(origin) && r.status() >= 400 && !/[/](favicon[.]ico|version[.]json)$/.test(r.url()) && errors.push(`HTTP ${r.status()}: ${r.url()}`));

  step = 'load app';
  await page.goto(origin + '/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('#app .tracks [data-track]'));

  step = 'choose a path';
  await page.evaluate(() => document.querySelector('#app [data-track="whole"]').click());
  await page.waitForFunction(() => document.querySelector('#app .seal') && !document.querySelector('#app .tracks'));

  step = 'settings view';
  await page.evaluate(() => { location.hash = 'settings'; });
  await page.waitForFunction(() => document.querySelector('#app .setlist [data-backup]'));

  for (const v of ['words', 'grammar']) {
    step = v + ' view';
    await page.evaluate(h => { location.hash = h; }, v);
    await page.waitForFunction(() => document.querySelector('#app .setlist h1.plate')?.textContent === (location.hash === '#words' ? 'My words' : 'Grammar'));
  }
} catch (e) {
  errors.push(`step "${step}" failed: ${e.message}`);
} finally {
  await browser.close();
  server.close();
}

if (errors.length) { console.error(`FAIL (${errors.length}):\n  ${[...new Set(errors)].join('\n  ')}`); process.exit(1); }
console.log('PASS smoke: app loads, path picker, home, settings, words and grammar views render, no console errors');
