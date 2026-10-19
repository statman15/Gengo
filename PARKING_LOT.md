# Parking Lot

## Inbox
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
