# Handoff (updated 2026-10-29)

Read CLAUDE.md first, then PLAN.md (decisions and status), DESIGN.md (visual system) and PARKING_LOT.md (deferred ideas). This file is what a new session needs on top of those.

## Where things stand

- **Released:** Android **1.1.30** on GitHub Releases, and the web app on Pages from the same commit (`5e7b7eb`). Everything Chris asked for is built, merged and live.
- **Branch:** work happens on `claude/keen-ptolemy-j1g925`; Chris says when to merge, usually after seeing screenshots. Merging means a fast-forward of `main` and a push.
- **Versioning:** `package.json` "version" is 1.1.0. CI names the release `v1.1.0` the first time, then `1.1.<run_number>` once that tag exists. Bump to 1.2.0 in package.json when Chris wants a new minor version.

## Built in this session (2026-10-22)

The learning-path review is `docs/superpowers/plans/2026-10-22-learning-path.md`; all nine changes in it are built.
- Phrase cards (`phrases.js`), spelling-rule cards (`rules.js`), kana hints and look-alikes (`kana.js`), and the kanji gate with readings taken from your own words.
- Pace (`pace.js`): kana by about week 3, N5 by month 6, N4 by month 12, scaled by accuracy and review load. "Keep practising" comes once the day's new items are used up.
- Tracks (`tracks.js`): Travel, Conversation and Whole language. Chosen on Today at first, changeable in Settings.
- Grammar through N5 and N4: 89 points (`grammar.js`, `grammar-acts.js`).
- Numbers, time and money: 13 lessons (`numbers.js`).
- Journey station sheets: tap a station to see what your path learns there (`data/journey-plan.json`). Stations are respaced so Kyoto lands at about the end of N4.
- Real word frequency (`scripts/word-order.mjs`, using wordfreq, CC BY-SA 4.0, credited in Settings).
- A ✕ close button on Learn, Review, Practice and the story questions.
- The friends row is gone from Today; it stays on the Friends tab.
- A Today note explaining when stories and chats appear: they need an AI connection, and 3 due words for a chat or 5 for a story. The no-AI note can be hidden; the setting is `aiNoteHidden`.

## Built on 2026-10-29

- **Stories and chats use learned words.** Before this, they used only words *due* that day (5 for a story, 3 for a chat). At the slower pace a learner almost never had that many words due: a simulation found 0 story days in the first month and 1–2 a month up to month 3. Doing reviews first also used up the due words.
  - They now take due words first, then other learned words, closest to due first (`learnedWords()` in app.js; `storyWords(due, learned)` and `chatWords(due, story, learned)`).
  - They show once 5 (story) or 3 (chat) words are learned and an AI is connected.
  - Only due words are graded; the rest is ungraded practice.
- **The Today note** now reads "A daily chat starts once you've learned 3 words, a story at 5. You know N so far". Without an AI connection it is the set-up/hide note.
- **Reviews come in chunks of 50** (`CHUNK` in app.js), with a "50 reviews done, N more are due" screen and *Keep going* / *Take a break* buttons.
  - Cards this device can't drill are remembered across chunks (the module-level `skipped` set) and cleared when the review finishes.
- **Missed days (answered for Chris, no change):** the new-item allowance is per day and never builds up. Reviews do pile up, but 50+ due within a day slows new items to 2 a day, and 100+ pauses them. Low accuracy over the week also slows new items.

## Gotchas

- **Settings are whitelisted** in `store.js` (`SETTINGS`). A new `db.settings` key that isn't added there is silently dropped on reload.
- **Changing the learning order** (session.js, pace, tracks, words order or stations) means rerunning `node scripts/journey-plan.mjs` so the station sheets match. After `scripts/words.mjs`, rerun `scripts/word-order.mjs` and then `journey-plan.mjs`.
- **Smoke test locally:** `CHROME_PATH=/opt/pw-browsers/chromium npm run smoke`. Puppeteer-core with that path also works for screenshots.
- **Expected console noise locally:** a 404 for `version.json` (CI writes it), the favicon, and the Worker host, which the sandbox blocks. CI's smoke run is the real gate.
- **The sandbox can't reach** `statman15.github.io`, `api.github.com` or Tatoeba. `raw.githubusercontent.com` works. Check CI, Pages and releases through the GitHub MCP tools.
- **The Pages deploy job sometimes sits queued** for 5–10 minutes. It goes queued, then waiting, then done; just recheck.
- **Don't run `pkill -f`**: it matches its own shell. Kill by PID.
- **A docs-only push to main may not start a release** (the 2026-10-22 handoff merge didn't). Don't promise one; check the Actions runs.
- **Driving drills in headless Chrome:** clicking the first `.choices .choice`, else the first `button.plate` that isn't the close button or a nav link, gets through a review at about 7 clicks a card. Allow about 400 clicks for 50 cards.

## Ideas not started (see PARKING_LOT.md)

- Personal FSRS parameters. These need a review log first, and would help learners who forget more than the default model predicts.
- Tune the print focus for each station.
- Live refresh of the Friends board, and the smaller group-sync gaps.
- Chris may want to set up AI (a free Gemini key) to try daily stories and chats.
