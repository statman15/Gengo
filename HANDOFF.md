# Handoff (2026-10-22)

Read CLAUDE.md first, then PLAN.md (decisions and status), DESIGN.md (visual system) and PARKING_LOT.md (deferred ideas). This file is what a new session needs on top of those.

## Where things stand

- **Released:** Android **1.1.29** on GitHub Releases, and the web app on Pages from the same commit (`01e1b90`). Everything Chris asked for is built, merged and live.
- **Branch:** work happens on `claude/keen-ptolemy-j1g925`; Chris says when to merge. Merging means a fast-forward of `main` and a push. The branch is one docs-only commit ahead of main (DESIGN.md and the learning-path review). It isn't worth a release of its own, so let it ride with the next change.
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

## Gotchas

- **Settings are whitelisted** in `store.js` (`SETTINGS`). A new `db.settings` key that isn't added there is silently dropped on reload.
- **Changing the learning order** (session.js, pace, tracks, words order or stations) means rerunning `node scripts/journey-plan.mjs` so the station sheets match. After `scripts/words.mjs`, rerun `scripts/word-order.mjs` and then `journey-plan.mjs`.
- **Smoke test locally:** `CHROME_PATH=/opt/pw-browsers/chromium npm run smoke`. Puppeteer-core with that path also works for screenshots.
- **Expected console noise locally:** a 404 for `version.json` (CI writes it), the favicon, and the Worker host, which the sandbox blocks. CI's smoke run is the real gate.
- **The sandbox can't reach** `statman15.github.io`, `api.github.com` or Tatoeba. `raw.githubusercontent.com` works. Check CI, Pages and releases through the GitHub MCP tools.
- **The Pages deploy job sometimes sits queued** for 5–10 minutes. It goes queued, then waiting, then done; just recheck.
- **Don't run `pkill -f`**: it matches its own shell. Kill by PID.

## Ideas not started (see PARKING_LOT.md)

- Personal FSRS parameters. These need a review log first, and would help learners who forget more than the default model predicts.
- Tune the print focus for each station.
- Live refresh of the Friends board, and the smaller group-sync gaps.
- Chris may want to set up AI (a free Gemini key) to try daily stories and chats.
