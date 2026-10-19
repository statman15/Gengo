# Parking Lot

## Inbox
- **Story uses up the chat's words.** The story takes up to 8 due words and answering it reviews them, so with fewer than about 11 due the chat button disappears. Could cap the story at 5 words, or let the chat reuse story words even after they're reviewed. (Stress test, 2026-10-19.)
- **Landscape answer choices.** At 844x390 the second row of answer choices sits below the fold. (Stress test.)
- **Settings AI status clipped.** "The key is stored only on this phone." wraps tightly next to Test Connection at 390px. (Stress test.)
- **Unknown hash and #learn edge cases.** An unknown hash renders Today but keeps the hash and highlights no tab; #learn opens while reviews are due. (Stress test.)
- **Junk ids in a restored backup.** A backup with thousands of made-up w- ids keeps them and can unlock grammar early; revive() could drop word ids that aren't in words.json once it has loaded. (Stress test.)
- **Story and chat speed on free Gemini.** gemini-flash-latest took 60-70 s for a story and is often busy (503), so most turns fall back to Flash-Lite. Worth trying a lower reasoning effort or a different default model. (Real-AI test, 2026-10-19.)
- **AnkiDroid import.** Read an AnkiDroid `.colpkg`/`.apkg` export (SQLite, via sql.js) and turn its review log into FSRS state, so Chris skips words he already knows. Skipped 2026-10-17: everyone starts from kana.
- **Live kana races.** Head-to-head at the same moment. Needs real-time sync (Durable Objects or WebSockets); the async daily race covers it for now.
- **Themed buildings.** Food words build the ramen shop, nature words the garden. Dropped for the Tōkaidō journey; could come back as side prints per word theme.
- **Backup to the Worker.** Each phone pushes its full data nightly so a lost phone can restore. The Export/Import file covers this for three people.
- **Textbook chapter coverage.** "You know 80% of your Living Language chapter 3 list", built from the typed-in personal lists. Not picked as a milestone in v1.
- **Speaking on iPhone.** Safari's speech recognition is unreliable; revisit if WebKit improves, or with a native iOS wrapper ($99/yr, see HypertroPhy's notes).
- **Tune print focus for every station.** `focus` in journey.js is hand-tuned only for stations 0–4 and 10; the rest use 50% 50%, so the seal may cover faces on some prints. Several scans are only ~720–1000 px wide and look soft in the portrait crop.
- **Live board refresh.** The Friends board loads once per visit. The Worker's KV list lags ~30 s after a post anyway.
- **Smaller group-sync gaps.** Restoring a backup on a new phone doesn't carry the group code; Leave Group leaves your row for up to 90 days; a race that runs past midnight isn't posted; joining via a link replaces an existing group without asking.
- **Throttle group creation.** `POST /group` on the Worker is unthrottled; the KV free tier simply stops at its daily quota, so no money is at risk.
- **Word frequency order.** Since 2026-10-19 words inside a JLPT level are ordered by how often they appear in our Tatoeba sentences (plus a polite starter set first). A real corpus frequency list (CC-licensed) would still order N5/N4 better than a 10k-sentence sample.
- **Fill-the-blank ambiguity.** About 1 in 14 Tatoeba fill sentences has a wrong choice that's arguably also grammatical (e.g. 和食＿＿好きですか with を). Could accept alternates per sentence or filter those sentences out.

- **Tap-to-peek in grammar sentences.** Known kanji in fill/build sentences have no peek for their reading.
