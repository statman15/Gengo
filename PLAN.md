# Gengo (言語) — Plan

A Japanese app for Chris (Android), his brother (Android) and a friend (iPhone). It keeps Anki's engine (FSRS spaced repetition) but turns every due review into a different activity, so it never feels like flipping the same card. Progress shows as a journey along Hiroshige's Tōkaidō road, and the three of them see each other's streaks and race at kana.

Repo: `statman15/Gengo` (public). Local folder: `C:\Users\ressl\Claude Code\Japanese_Langauge_App`.

## Why this exists

Chris learned with AnkiDroid and knows spaced repetition works, but flipping the same cards got boring and he quit. He also tried Renshuu. It didn't stick because it felt **busy and cluttered**, he had **no one to study with**, and **progress felt invisible**. Gengo answers each of those: one obvious thing to do on the home screen, a group of three, and progress you can see (the Tōkaidō prints, "you can read 50% of this NHK Easy article").

What Renshuu doesn't have and Gengo will: stories made from your own due words, FSRS, speech that gets checked, a private group of three, and progress measured in real reading.

## Decisions (settled 2026-10-17, grilling session)

| Area | Decision |
|---|---|
| Users | Chris and his brother on Android, a friend on iPhone. No accounts, no app stores. |
| Stack | HypertroPhy's setup: plain HTML/JS ES modules, **no build step, no framework**. iPhone: PWA from GitHub Pages. Android: Capacitor APK built and released by GitHub Actions on every push, with the same CI gate (`npm test` + headless smoke). npm is only for Capacitor tooling and data-prep scripts. |
| Data | On each phone, in `localStorage` (IndexedDB if it outgrows that). Export/Import a JSON file and a nag after 14 days without a backup, as in HypertroPhy (this matters most on the friend's iPhone, where deleting the icon wipes the data). AI keys never go into the backup. |
| Scheduler | [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), vendored as one ES module file (pinned version) so the APK works offline. |
| Starting point | **Everyone starts from kana.** No AnkiDroid import (parked). |
| Kana | Every hiragana, then every katakana, is an FSRS card that goes through the same activities. A word unlocks only once you know its kana. |
| Word order | Most common first: JMdict frequency tags (`news1`/`ichi1`/`nfXX`) plus JLPT level. Each person can also **type in their own lesson words** (for example the chapter they're on in Japanese Living Language). JMdict supplies the meanings. Publishers' lists (Genki, Living Language, Core 2k/6k) are never shipped. |
| Sessions | **Open-ended.** Due reviews come first. When they're cleared, the app asks "Learn new words?" each time; there's no fixed daily cap. |
| Activities | One item, several ways to review it. M1: **listening** (hear it, pick the meaning/kana), **kana tiles** (build the word from shuffled tiles), **speaking** (Android only; the iPhone never shows it). Later: reading in context (Tatoeba sentence), stories, kanji tracing, AI chat. |
| Activity ladder | Picked from the item's **FSRS stability**: weak items get recognition (listening), middle items get building (tiles), strong items get production (speaking, later tracing). Thresholds live in one settings object so they can be tuned. |
| Grading | **Automatic, no rating buttons.** Wrong = Again; right but slow or after a hint = Hard; right = Good; right on an activity above the item's rung = Easy. |
| Streak | The day counts when **no reviews are left due** (or at least 10 were done on a backlog day). One free rest day per week. |
| Stories | An optional "Read today's story" card once 5 or more items are due. The AI writes a short story or conversation at your level using those words. Understanding each word (a quick question per word) counts as its review. Skipped words stay due as normal activities. |
| Progress view | **The Tōkaidō journey**: Hiroshige's *Fifty-three Stations of the Tōkaidō* (public domain, 55 prints from Nihonbashi to Kyoto). Mastered-word milestones unlock the next station. The current print fades from ink sketch to full colour as you approach the next milestone (CSS filters on the scan, so no extra art). **Mastered = FSRS stability ≥ 21 days.** Big milestones also earn a named moment ("You reached Hakone"). |
| Other milestones | "You can read X% of today's NHK Easy article" (its words checked against your known items), and kana/JLPT coverage ("All hiragana", "60% of N5"). |
| Look | Settled during the build with the **impeccable** and **frontend-design** skills. Fixed going in: the home screen has one obvious next action (an answer to Renshuu's clutter), the journey is always visible, and the friends' status is one glance away. The three throwaway mockups from the grilling are in `.superpowers/brainstorm/` (git-ignored). |
| Sharing | A **Cloudflare Worker + KV** (free tier, about 30 lines). Each phone posts a small stats summary under a shared group code: streak, reviews this week, mastered count, current station, today's race time. Word data never leaves the phone. |
| Leaderboard | **Reviews this week** (resets Monday so a newer learner can win), with streaks shown alongside. |
| Kana race | **Async daily**: the same 20 kana for everyone each day (seeded by date); the fastest accurate time wins. No need to be online together. |
| AI | HypertroPhy's connection: one OpenAI-compatible URL + key + model in Settings, stored only on that phone. Chris uses OmniRoute (home address first, then Tailscale, then Gemini as a labelled fallback). The brother and friend each use **their own free Gemini key**. Expected cost: about $0. |
| TTS / speech | The phone's built-in Japanese voice. Web: `speechSynthesis`. Android: the Capacitor text-to-speech and speech-recognition community plugins, because the WebView's Web Speech support is unreliable. |
| Name | **Gengo** (言語, "language"). |

## Data sources (all free; attribution goes on an About page)

| Source | Use | Licence |
|---|---|---|
| JMdict ([jmdict-simplified](https://github.com/scriptin/jmdict-simplified) JSON) | Words, readings, meanings, frequency tags. Ship the "common" subset, trimmed by a prep script. | CC BY-SA 4.0 |
| KANJIDIC2 | Kanji meanings and readings (M4) | CC BY-SA 4.0 |
| KanjiVG | Stroke order and tracing (M4) | CC BY-SA 3.0 |
| Tatoeba | Example sentences for reading in context (M2), pre-matched to words by a prep script | CC BY 2.0 FR |
| Hiroshige, *Tōkaidō* (Met Open Access or Wikimedia scans) | The journey | Public domain |
| JLPT level lists (community-made, e.g. from Jonathan Waller's lists) | Ordering and coverage | Check the licence in M2 |

Data prep scripts live in `scripts/` (Node), write trimmed JSON into `data/`, and are run by hand. They're not part of a build.

## Milestones (each ends with something all three can use)

1. **Kana together.** The repo, Pages, the APK workflow and the CI gate copied from HypertroPhy. Kana as FSRS cards with listening, tiles and speaking (Android). Automatic grading, open-ended sessions, the streak. The journey with its first few prints. The Worker with group code, weekly leaderboard and daily kana race. Backup.
   *Done when:* all three have learned kana for a week and can see each other on the board.
2. **First words.** The JMdict common subset in frequency/JLPT order, "Learn new words?", typed-in personal word lists, reading in context (Tatoeba), the full activity ladder, the NHK Easy % and JLPT coverage milestones.
   *Check first:* whether the NHK Easy site can be fetched (the Worker can proxy it if CORS blocks the browser).
3. **Stories.** AI connection settings (HypertroPhy's `ai.js` pattern), "Read today's story" with per-word questions that count as reviews, and hints.
4. **Kanji.** KANJIDIC kanji cards and KanjiVG tracing as the top rung for kanji.
5. **AI chat.** A short conversation that has to use some of your due words, graded by the AI.

## Claude's calls (from the builder check, not discussed with Chris; change any)

- **Joining the group:** Chris's phone creates the group and gets a random code. The others join through a share link (`…/#join=<code>`) and enter a display name. The Worker keeps one small record per person under `group:<code>:<name>`. A request without a valid code gets nothing, so the Worker URL being visible in the public repo doesn't matter.
- **Kana race:** one attempt a day. You see a kana and pick its sound from 4 choices. Each wrong answer adds 3 s. The seed is the phone's local date. Times are self-reported and not checked; that's fine for three friends.
- **Kana rungs:** hear it, pick the kana → see it, pick its sound → say it (Android). Tiles start with words in M2, since one kana has nothing to build. A hint is "play the sound again"; slow means over 8 s. Both are tunable.
- **Speaking check:** the recognised text is converted to hiragana and compared loosely (a long vowel or small-kana difference still passes). After two misses the app plays the answer and grades Hard instead of Again, so bad recognition never stalls you.
- **Updates:** the iPhone web app updates itself on every open (network-first service worker). The Android app checks GitHub's latest release on open (at most every 6 h) and shows an Update banner that downloads and opens the installer in-app (`update.js`, ported from HypertroPhy). Releases must keep the same signing key.
- **Prints:** all 55 prints from the Wikimedia set, resized to WebP (about 100 KB each) and bundled, so the APK works offline.
- **iPhone:** an installed home-screen PWA is exempt from Safari's 7-day storage eviction, so setup tells the friend to install it. If no Japanese voice is found, the app shows how to add one (Settings → Accessibility → Spoken Content → Voices → Japanese).
- **Streak week:** starts Monday, like the board. A day with nothing due counts only if you did at least one activity.

## Left to the builder

- File layout, storage keys and the exact ladder/grading thresholds (keep them in one place so they can be tuned).
- How many mastered items each Tōkaidō station costs (start cheap, around 10 items per station during kana, rising later; keep it tunable).
- Worker auth: a group code in a header is enough for three people. Validate and size-limit what the Worker stores.

## Open risks

- The Android WebView's speech recognition and TTS need the community plugins; check both on a real phone in M1.
- The iPhone PWA has no speaking, and its Japanese TTS voice depends on what's installed on the phone.
- The full JMdict is ~100 MB; the common subset must stay small enough to load on a phone (aim for under 5 MB gzipped).
- Hiroshige scans are large; ship resized WebP copies.

## Status (2026-10-18)

M1 "Kana together" is built and released: https://statman15.github.io/Gengo/ (iPhone, Add to Home Screen) and the signed APK on https://github.com/statman15/Gengo/releases (v1.0.2). Built subagent-driven from `docs/superpowers/plans/2026-10-17-m1-kana-together.md`, a review after every task plus a final whole-branch review.

- **Look:** "Living Hiroshige Plate" (Chris's pick). The station's print is the screen, every word sits on paper, a hanko seal is the one action; iOS and Material chrome per phone. See DESIGN.md and PRODUCT.md.
- **Group sync:** Cloudflare Worker `gengo` at https://gengo.ressler-chris.workers.dev (KV namespace GENGO, Chris's Cloudflare account). Redeploy from `worker/` with `npx wrangler deploy` (use `npx.cmd` in PowerShell). Groups cap at 20 members; records expire after 90 days without an update.
- **Android users join** from Settings > Join Group by pasting the invite link (the link itself opens Chrome, not the app).
- **Updates:** the iPhone web app updates itself on every open (network-first service worker). The Android app checks GitHub's latest release on open (at most every 6 h) and shows an Update banner that downloads and opens the installer in-app (`update.js`, ported from HypertroPhy). Releases must keep the same signing key.
- **Prints:** 55 Hōeidō scans, ~32 MB, credits in prints/CREDITS.md.
- **Still to check on real phones (M1 done-when):** speaking and TTS on Android, the Japanese voice on iPhone, group join across all three, a week of kana.
