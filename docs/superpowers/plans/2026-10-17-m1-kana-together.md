# M1 "Kana together" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chris, his brother (Android APK) and a friend (iPhone PWA) learn all hiragana and katakana as FSRS cards through hear/see/say activities, watch their Tōkaidō journey grow, and see each other on a weekly board with a daily kana race.

**Architecture:** One set of plain ES-module web files at the repo root (no build step), copied into a Capacitor Android shell by `copy-web.js`; logic lives in small pure modules with `node *.test.js` assert checks, and UI modules stay thin. All learning data stays in `localStorage`; a Cloudflare Worker + KV holds only a small stats record per phone.

**Tech Stack:** HTML/CSS/JS (ES modules), ts-fsrs (vendored), Capacitor 8 + `@capacitor-community/text-to-speech` + `@capacitor-community/speech-recognition`, Cloudflare Workers + KV (wrangler), puppeteer-core smoke test, GitHub Actions + Pages.

**Spec:** `PLAN.md` (read it first; its "Claude's calls" section is part of the spec). Copy patterns from `C:\Users\ressl\Claude Code\Weightlifting_App` (HypertroPhy): `copy-web.js`, `smoke.mjs`, `sw.js`, `ui.js`, `store.js`, `.github/workflows/android.yml`, `capacitor.config.json`, `package.json`.

## Global Constraints

- No build step, no framework. Every web file is a native ES module loaded by `index.html`.
- Every feature works on the iPhone PWA except speaking; the iPhone never shows a speaking activity.
- Tests: one `<module>.test.js` per pure module using `node:assert`, all chained in `npm test`. `npm run smoke` must load the app in headless Chrome with zero console/page errors.
- Mastered = FSRS stability ≥ 21 days.
- Grading: wrong = Again (1); right but slow (> 8 s) or hinted (sound replayed) = Hard (2); right on a stretch activity above the item's rung = Easy (4); right = Good (3). Speaking: after 2 misses, play the answer and grade Hard.
- Streak: a day counts if reviews ≥ 10, or if due reached 0 that day and reviews ≥ 1. One free rest day per Monday-start week.
- Kana race: 20 kana per day, seeded by the phone's local date, pick the sound from 4 choices, +3 s per wrong answer, one attempt per day.
- Learning data never leaves the phone; the Worker receives only `{name, streak, week, mastered, station, race}`.
- Thresholds live in one exported `TUNING` object in `srs.js`.
- appId `com.statman15.gengo`, app name `Gengo`, repo `statman15/Gengo` (public), Pages URL `https://statman15.github.io/Gengo/`.
- Attribution for KanjiVG/JMdict isn't needed in M1. Hiroshige prints are public domain; credit "Utagawa Hiroshige, Wikimedia Commons" on the journey screen.

## Review Focus

1. **Day boundaries in local time:** a review at 23:59 and one at 00:01 land on different days; the streak and weekly count use the phone's local date, never UTC. (Tests in Task 4.)
2. **A corrupt or old `localStorage` or backup file:** the app still opens; bad fields are dropped, not rendered. (Tests in Task 3.)
3. **No Japanese voice (iPhone) or speech permission denied (Android):** the hear rung falls back to see, and the say rung falls back to see; the session never dead-ends. (Tests in Task 7.)
4. **Worker unreachable or offline:** studying is unaffected; the board shows "Offline" and stats are re-posted on the next open. (Tests in Task 9.)
5. **Two group members with the same name:** both appear; records are keyed by a per-phone device id, not by name. (Tests in Task 8.)

---

### Task 1: Web skeleton, test runner, smoke gate

**Files:**
- Create: `package.json`, `copy-web.js`, `smoke.mjs`, `index.html`, `app.js`, `ui.js`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`

**Interfaces:**
- Produces: `ui.js` exports `$(sel)`, `esc(str)`, `sheet(html)` (copied from HypertroPhy). `app.js` exports `show(view: 'home'|'session'|'journey'|'group'|'settings', arg?)`, a router that renders into `#app`; each view module exports `render(el, arg)`.

- [ ] **Step 1:** Copy `package.json` from HypertroPhy. Rename it `gengo`, keep only `@capacitor/android`, `@capacitor/core`, `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/share`, devDeps `@capacitor/cli`, `puppeteer-core`. Set `"test": "node kana.test.js"` for now (each later task appends its test file).
- [ ] **Step 2:** Copy `copy-web.js` and `smoke.mjs` unchanged, except that the `skip` regex also excludes `worker|scripts|docs`. Copy `sw.js` with cache name `gengo-v1`, plus a bare `index.html` that loads `app.js` and shows "Gengo" on a home view.
- [ ] **Step 3:** Run `npm install`, then `npm run smoke`. Expected: smoke passes with no console errors.
- [ ] **Step 4:** Commit: `git commit -m "feat: web skeleton with smoke gate"`

### Task 2: Kana data and the FSRS layer

**Files:**
- Create: `kana.js`, `srs.js`, `vendor/ts-fsrs.mjs`, `kana.test.js`, `srs.test.js`

**Interfaces:**
- Produces:
  - `kana.js`: `KANA: {id: string, kana: string, sound: string, script: 'hira'|'kata'}[]`, with ids `h-<sound>` / `k-<sound>` (`h-a`, `k-shi`; the dakuten duplicates are `h-ji2` for ぢ and `h-zu2` for づ). Order: hiragana gojūon (46), dakuten (20), handakuten (5), then the same for katakana: 142 items.
  - `srs.js`: `TUNING = {seeAt: 3, sayAt: 10, mastered: 21, slowMs: 8000, stretch: 0.2}`; `newCard(now: Date): Card`; `review(card: Card, rating: 1|2|3|4, now: Date): Card`; `isDue(card, now): boolean`; `isMastered(card): boolean`; `rungFor(card, {canHear: boolean, canSay: boolean}): 'hear'|'see'|'say'`; `pickRung(card, caps, rand: () => number): {rung, stretch: boolean}`; `ratingFor({correct, ms, hinted, stretch, speechFallback}): 1|2|3|4`. `Card` is the ts-fsrs card with `due`/`last_review` as `Date`.

- [ ] **Step 1: Write the failing tests**

```js
// kana.test.js
assert.equal(KANA.length, 142);
assert.equal(new Set(KANA.map(k => k.id)).size, 142);
const s = Object.fromEntries(KANA.filter(k => k.script === 'hira').map(k => [k.kana, k.sound]));
assert.deepEqual([s['し'], s['ち'], s['つ'], s['ふ'], s['を'], s['ん'], s['ぢ'], s['づ']], ['shi','chi','tsu','fu','wo','n','ji','zu']);
assert.equal(KANA.find(k => k.id === 'k-a').kana, 'ア');
// srs.test.js
const now = new Date('2026-10-17T10:00:00');
const c = newCard(now);
assert.equal(isDue(c, now), true);
assert.equal(rungFor(c, {canHear: true, canSay: true}), 'hear');
assert.equal(rungFor({...c, stability: 5}, {canHear: true, canSay: true}), 'see');
assert.equal(rungFor({...c, stability: 12}, {canHear: true, canSay: true}), 'say');
assert.equal(rungFor({...c, stability: 12}, {canHear: true, canSay: false}), 'see');
assert.equal(rungFor(c, {canHear: false, canSay: false}), 'see');
assert.equal(isMastered({...c, stability: 21}), true);
assert.equal(isMastered({...c, stability: 20.9}), false);
assert.equal(ratingFor({correct: false, ms: 1000}), 1);
assert.equal(ratingFor({correct: true, ms: 9000}), 2);
assert.equal(ratingFor({correct: true, ms: 1000, hinted: true}), 2);
assert.equal(ratingFor({correct: true, ms: 1000, speechFallback: true}), 2);
assert.equal(ratingFor({correct: true, ms: 1000, stretch: true}), 4);
assert.equal(ratingFor({correct: true, ms: 1000}), 3);
const next = review(c, 3, now);
assert.ok(next.due > now && next.reps === 1);
assert.deepEqual(pickRung({...c, stability: 5}, {canHear: true, canSay: true}, () => 0.1), {rung: 'say', stretch: true});
assert.deepEqual(pickRung({...c, stability: 5}, {canHear: true, canSay: false}, () => 0.1), {rung: 'see', stretch: false});
```

- [ ] **Step 2:** Run `node kana.test.js && node srs.test.js`. Expected: FAIL (modules missing).
- [ ] **Step 3:** `npm install --save-dev ts-fsrs` (pin the exact version it installs). Copy its bundled ESM build (`node_modules/ts-fsrs/dist/index.mjs`) to `vendor/ts-fsrs.mjs`, and check that it has no bare `import` statements. Put the version in a first-line comment. Implement `kana.js` and `srs.js` with `fsrs().next(card, now, rating).card`. `pickRung` stretches one rung up when `rand() < TUNING.stretch` and that rung is allowed by `caps`.
- [ ] **Step 4:** Run `npm test` with both files added. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: kana data and FSRS layer`

### Task 3: Store, backup and validation

**Files:**
- Create: `store.js`, `store.test.js`

**Interfaces:**
- Consumes: `newCard`, `KANA` ids.
- Produces: `db` (live object) with `settings {name, deviceId, groupCode, lastBackup, newBatch: 5}`, `cards {[id]: Card}`, `days {[YYYY-MM-DD]: {reviews: number, cleared: boolean}}`, `race {[YYYY-MM-DD]: {time: number}}`; `save()`; `exportJSON(): string`; `importJSON(text): {ok: boolean, error?: string}` (replaces `db` on success, keeps `settings.deviceId` and `groupCode`); `revive(raw): db` (pure; drops any unknown card id, non-numeric fields and invalid dates, and turns date strings back into `Date`).

- [ ] **Step 1: Write the failing tests:** round-trip `revive(JSON.parse(exportJSON()))` keeps a reviewed card's `due` as an equal `Date`. `revive` of `{cards: {'h-a': {due: 'garbage'}, 'zzz': {...}}, days: {'2026-10-17': {reviews: 'x'}}}` returns no `zzz`, no broken `h-a`, and no bad day. `importJSON('not json').ok === false`, and `db` is unchanged. `deviceId` is generated once (`crypto.randomUUID()`) and kept across imports.
- [ ] **Step 2:** Run it; expect FAIL. **Step 3:** Implement against `localStorage` key `gengo`, with an in-memory fallback when `localStorage` is undefined (node tests). **Step 4:** `npm test` PASS. **Step 5:** Commit: `feat: store with validated backup`

### Task 4: Streak and weekly count

**Files:**
- Create: `streak.js`, `streak.test.js`

**Interfaces:**
- Produces: `dayKey(d: Date): string` (local date, `YYYY-MM-DD`); `counts(day): boolean`; `streak(days, today: Date): number`; `weekReviews(days, today: Date): number` (Monday through today, local).

- [ ] **Step 1: Write the failing tests**

```js
assert.equal(dayKey(new Date(2026, 9, 17, 23, 59)), '2026-10-17');
assert.equal(dayKey(new Date(2026, 9, 18, 0, 1)), '2026-10-18');
assert.equal(counts({reviews: 10, cleared: false}), true);
assert.equal(counts({reviews: 1, cleared: true}), true);
assert.equal(counts({reviews: 0, cleared: true}), false);
assert.equal(counts({reviews: 9, cleared: false}), false);
const ok = {reviews: 12, cleared: true};
// Sat 2026-10-17: Mon 12..Fri 16 all done, today not yet done -> streak 5 (today doesn't break it)
assert.equal(streak({'2026-10-12': ok, '2026-10-13': ok, '2026-10-14': ok, '2026-10-15': ok, '2026-10-16': ok}, new Date(2026, 9, 17, 9)), 5);
// one missed day in a week is a rest day; two break it
assert.equal(streak({'2026-10-12': ok, '2026-10-14': ok, '2026-10-15': ok, '2026-10-16': ok}, new Date(2026, 9, 17, 9)), 4);
assert.equal(streak({'2026-10-12': ok, '2026-10-15': ok, '2026-10-16': ok}, new Date(2026, 9, 17, 9)), 2);
assert.equal(weekReviews({'2026-10-11': ok, '2026-10-12': ok, '2026-10-17': {reviews: 3}}, new Date(2026, 9, 17)), 15);
```

- [ ] **Steps 2–5:** fail, implement, pass, commit `feat: streak and weekly count`. A rest day adds nothing to the count; it only bridges the gap.

### Task 5: Speech (TTS and recognition)

**Files:**
- Create: `speech.js`, `speech.test.js`
- Modify: `package.json` (add `@capacitor-community/text-to-speech`, `@capacitor-community/speech-recognition`, versions compatible with Capacitor 8; check their peerDependencies)

**Interfaces:**
- Produces: `speak(text): Promise<void>`; `canHear(): Promise<boolean>` (native: true; web: a `ja-JP` voice exists after `voiceschanged` or 1 s); `canSay(): Promise<boolean>` (native Android with the plugin available and permission granted; always false on the web); `listen(): Promise<string[]>` (alternatives, `ja-JP`); `toHira(s): string`; `heardMatches(alts: string[], item: {kana, sound}): boolean`.

- [ ] **Step 1: Write the failing tests** (pure parts only)

```js
assert.equal(toHira('シャツ'), 'しゃつ');
assert.equal(heardMatches(['あ'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['ア'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['a'], {kana: 'あ', sound: 'a'}), true);
assert.equal(heardMatches(['かあ'], {kana: 'か', sound: 'ka'}), true);   // long vowel still passes
assert.equal(heardMatches(['き'], {kana: 'か', sound: 'ka'}), false);
assert.equal(heardMatches([], {kana: 'か', sound: 'ka'}), false);
```

- [ ] **Steps 2–5:** fail, implement, pass, commit `feat: speech wrapper`. Native detection: `window.Capacitor?.isNativePlatform()`; reach plugins through `Capacitor.Plugins.TextToSpeech` / `SpeechRecognition` (no bundler). `heardMatches`: normalise each alternative with `toHira`, lower-case and trim it, and drop trailing `ー`/repeated vowels. It passes if the result starts with `toHira(item.kana)` or equals `item.sound`.

### Task 6: Design pass (main session, not a sub-agent)

**Files:**
- Create: `DESIGN.md`
- Modify: `index.html` (CSS tokens and base styles)

- [ ] **Step 1:** Invoke the `impeccable` and `frontend-design` skills. Brief: the home screen has one obvious next action, the current Tōkaidō print is always visible, and friends are one glance away. The answer screens are calm, with large kana. Light/dark follows the phone. The constraints are in PLAN.md "Look".
- [ ] **Step 2:** Show Chris 2–3 home + session mockups in the browser pane, then record the chosen direction, tokens and screen layouts in `DESIGN.md`.
- [ ] **Step 3:** Put the tokens and base components (button, choice grid, card, top bar) into `index.html` CSS. `npm run smoke` passes. Commit: `feat: design system`

### Task 7: Session and activities

**Files:**
- Create: `session.js`, `activities.js`, `session.test.js`
- Modify: `app.js` (home view: due count + Start; "Learn new kana?" when nothing is due)

**Interfaces:**
- Consumes: `KANA`, `newCard/review/isDue/pickRung/ratingFor/TUNING`, `db/save`, `dayKey`, `speak/canHear/canSay/listen/heardMatches`.
- Produces: `dueQueue(cards, now): string[]` (due ids, most overdue first); `nextNew(cards, n): string[]` (the first `n` KANA ids with no card, in KANA order); `choices(item, pool, rand): item[]` (4 distinct items of the same script including `item`, shuffled); `activities.js` exports `hear(el, item, done)`, `see(el, item, done)`, `say(el, item, done)`, where `done({correct, ms, hinted, speechFallback})`.
- Behaviour: *hear* plays the sound, then shows 4 kana (replay button = hinted). *see* shows the kana, then 4 sounds as romaji. *say* shows the kana and listens; after 2 misses it plays the answer and calls `done({correct: true, speechFallback: true})`. After each answer: `review`, `save`, `days[today].reviews++`; when the queue empties, `days[today].cleared = true`. Learning new kana: show the kana with its sound (tap to hear), then queue it at once as a *hear* review.

- [ ] **Step 1: Write the failing tests:** `dueQueue` order; `nextNew({}, 5)` returns `['h-a','h-i','h-u','h-e','h-o']`; `choices` returns 4 distinct items, all the same script, including the item, for every KANA item with a seeded rand. When `canHear` and `canSay` are both false, `pickRung` never returns `hear` or `say` (Review Focus 3).
- [ ] **Steps 2–4:** fail, implement, pass. **Step 5:** In the browser pane (`npx http-server -p 5173 -c-1`), learn 5 kana and answer each activity right and wrong; the console is clean. **Step 6:** Commit `feat: kana sessions with hear/see/say`

### Task 8: Worker (group stats)

**Files:**
- Create: `worker/index.js`, `worker/wrangler.toml`, `worker/worker.test.js`

**Interfaces:**
- Produces HTTP API (JSON, CORS `*`):
  - `POST /group` → `{code}`: a 10-character code from `crypto.getRandomValues` over `abcdefghjkmnpqrstuvwxyz23456789`; stores `g:<code>` = `"1"`.
  - `PUT /group/<code>/<deviceId>` with body `{name, streak, week, mastered, station, race: {day, time} | null}` → 204. 404 if the group is unknown. 400 if the body is over 1 KB, if `name` isn't 1–20 characters, or if a number is negative or not finite. Stores `m:<code>:<deviceId>` with `t: Date.now()`.
  - `GET /group/<code>` → `[{name, streak, week, mastered, station, race, t}]` (KV `list({prefix: 'm:<code>:'})`), 404 if the group is unknown.
  - `export default { fetch: (req, env) => handle(req, env) }` with `handle` exported for tests; KV binding `GENGO`.

- [ ] **Step 1: Write the failing tests** in node with a fake KV (`Map`-backed `get/put/list`): create a group; PUT two devices with the same name `"Chris"`, and GET returns both (Review Focus 5); a PUT to an unknown code gives 404; a 2 KB body, a `name: ''` or a `week: -1` gives 400; GET of an unknown code gives 404.
- [ ] **Steps 2–4:** fail, implement, pass; add `node worker/worker.test.js` to `npm test`.
- [ ] **Step 5 (Chris runs this):** `npx wrangler login`, `npx wrangler kv namespace create GENGO` (paste the id into `wrangler.toml`), `npx wrangler deploy` from `worker/`. Record the `*.workers.dev` URL in `group.js` as `WORKER_URL`. Use the hand-off tool for these steps.
- [ ] **Step 6:** Commit `feat: group stats worker`

### Task 9: Group client, board and daily race

**Files:**
- Create: `group.js`, `race.js`, `race.test.js`, `board.js` (view)

**Interfaces:**
- Consumes: Worker API, `db`, `streak/weekReviews/dayKey`, `isMastered`, `journey()` (Task 10; post `station: 0` until Task 10 lands), `choices`.
- Produces: `race.js`: `raceItems(day: string, n = 20): item[]` (deterministic: mulberry32 seeded by a string hash of `day`, no repeats, drawn from KANA); `raceTime(ms, wrong) = ms + 3000 * wrong`. `group.js`: `createGroup()`, `joinFromHash()` (handles `#join=<code>`, asks for a display name, saves `groupCode`), `postStats()` (on open and after every session; failures ignored), `board(): Promise<rows | 'offline'>`.
- Board view: sorted by `week` descending, showing name, 🔥streak, week, station name and today's race time. A Share Invite button opens the share sheet (or copies) `https://statman15.github.io/Gengo/#join=<code>`. The race screen runs once per day; when it's already done, it shows the time.

- [ ] **Step 1: Write the failing tests:** `raceItems('2026-10-17')` deep-equals itself on a second call, differs from `raceItems('2026-10-18')`, and has 20 unique ids; `raceTime(30000, 2) === 36000`. A `board()` that calls a `fetch` stub which rejects returns `'offline'` (inject `fetch` as a parameter so node can test it; Review Focus 4).
- [ ] **Steps 2–4:** fail, implement, pass. **Step 5:** browser-pane check against the deployed Worker with two browser profiles in one group. **Step 6:** Commit `feat: group board and daily kana race`

### Task 10: Tōkaidō journey

**Files:**
- Create: `scripts/prints.mjs`, `prints/00.jpg` … `prints/54.jpg`, `journey.js`, `journey.test.js`
- Modify: `app.js` (current print on the home screen; the journey view lists the stations reached)

**Interfaces:**
- Produces: `STATIONS: {name: string, jp: string}[]` (55, Nihonbashi → Kyoto, Hōeidō edition order); `stationCost(i): number` (mastered items needed to reach station i: 10 per station for stations 1–14, then 25 each; tunable constants at the top); `journey(mastered: number): {station: number, progress: number}` (`progress` 0–1 toward the next station; 1 at the last).
- View: the current print with `filter: grayscale(1-p) sepia(.4*(1-p))`. On reaching a station, a one-time "You reached <name>" moment. Credit line: "Utagawa Hiroshige, Wikimedia Commons".

- [ ] **Step 1:** `scripts/prints.mjs` (run by hand, Node 22 `fetch`): for each station, download the Wikimedia Commons file from the category *The Fifty-three Stations of the Tōkaidō (Hōeidō edition)* as an 800 px-wide thumbnail through `Special:FilePath/<file>?width=800`, saved to `prints/NN.jpg`. File names are listed in the script. Check that the total stays under 8 MB.
- [ ] **Step 2: Write the failing tests:** `journey(0)` → `{station: 0, progress: 0}`; `journey(10).station === 1`; `journey(140).station === 14`; `journey(165).station === 15`; `journey(1e6).station === 54` with `progress === 1`; `STATIONS.length === 55`.
- [ ] **Steps 3–5:** fail, implement, pass. **Step 6:** Commit `feat: Tōkaidō journey`

### Task 11: Settings, backup nag, iPhone voice guidance

**Files:**
- Create: `settings.js` (view)
- Modify: `app.js`

- [ ] **Step 1:** Settings: name, the group (Create / Share Invite / Leave), Save Backup / Restore (HypertroPhy's share-or-download pattern; on Android, Filesystem + Share), and new kana per batch (default 5).
- [ ] **Step 2:** A home banner after 14 days without a backup. On the web, when `canHear()` is false, a one-time card shows the iPhone path *Settings → Accessibility → Spoken Content → Voices → Japanese*, and the hear rung is skipped until a voice is available.
- [ ] **Step 3:** Smoke test plus a browser-pane check: restoring a corrupt file shows an error and changes nothing. Commit `feat: settings and backup`

### Task 12: Android app, CI and GitHub

**Files:**
- Create: `capacitor.config.json` (`appId com.statman15.gengo`, `appName Gengo`, `webDir www`), `android/` (generated), `.github/workflows/android.yml` (copied from HypertroPhy, names changed), `CLAUDE.md` (HypertroPhy's "Every change ships to both apps" and "Working here" sections, adapted)

- [ ] **Step 1:** `npx cap add android`; add the `RECORD_AUDIO` permission; `npm run sync`; build a debug APK on an emulator, and check that TTS speaks and `canSay()` asks for the microphone.
- [ ] **Step 2 (confirm with Chris first: it creates a public repo):** `gh repo create statman15/Gengo --public --source . --push`. Reuse HypertroPhy's keystore (`~/hypertrophy-keystore`) as repo secrets `KEYSTORE_B64` / `KEYSTORE_PASSWORD` via `gh secret set` from those files. Set Pages source to "GitHub Actions".
- [ ] **Step 3:** Push; confirm the `check` job passes, Pages serves the app, and a signed APK release is published. Commit any fixes.

### Task 13: Three-phone check

- [ ] **Step 1 (Chris and the others):** Chris installs the APK and creates the group; his brother installs the APK and joins via the invite link; the friend opens the Pages URL in Safari, adds it to the Home Screen, adds a Japanese voice if prompted, and joins. Each learns 5 kana and runs the daily race. Use the hand-off tool for these steps.
- [ ] **Step 2:** Confirm that all three appear on each phone's board. Note what broke in PLAN.md, and mark M1 ✅ there.
