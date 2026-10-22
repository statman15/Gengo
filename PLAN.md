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
| JLPT level lists (Jonathan Waller's, via open-anki-jlpt-decks) | Ordering and coverage | CC BY |

Data prep scripts live in `scripts/` (Node), write trimmed JSON into `data/`, and are run by hand. They're not part of a build.

## Milestones (each ends with something all three can use)

1. **Kana together.** The repo, Pages, the APK workflow and the CI gate copied from HypertroPhy. Kana as FSRS cards with listening, tiles and speaking (Android). Automatic grading, open-ended sessions, the streak. The journey with its first few prints. The Worker with group code, weekly leaderboard and daily kana race. Backup.
   *Done when:* all three have learned kana for a week and can see each other on the board.
2. **First words and sentences.** The JMdict common subset in frequency/JLPT order, "Learn new words?", typed-in personal word lists, reading in context (Tatoeba), the full activity ladder, the NHK Easy % and JLPT coverage milestones, plus the first ~15 grammar points with their lessons and activities (see "Grammar" below).
   *Check first:* whether the NHK Easy site can be fetched (the Worker can proxy it if CORS blocks the browser).
3. **Stories.** Also the **Say/translate it** grammar activity (English sentence → Japanese, typed or spoken, AI-graded), since it needs the AI connection. AI connection settings (HypertroPhy's `ai.js` pattern), "Read today's story" with per-word questions that count as reviews, and hints.
4. **Kanji.** KANJIDIC kanji cards and KanjiVG tracing as the top rung for kanji.
5. **AI chat.** A short conversation that has to use some of your due words, graded by the AI.

## Grammar (decided 2026-10-18, second grilling round)

Kana alone isn't reading. Grammar points are taught and reviewed alongside words, so sentences make sense from the start.

| Area | Decision |
|---|---|
| What counts as a grammar point | Particles (は/が/を/に/で …), verb and adjective forms (ます, past, negative, て form …) and sentence patterns (〜てもいいです, 〜たい …). Each is an FSRS review item. |
| Explanations | **Written for Gengo:** short plain-English explanations with 2–3 example sentences each, drafted once with AI, checked, and shipped offline in the app. Genki and Living Language text is never copied. More examples come from Tatoeba. |
| Order | **Standard beginner path** (です → は/が → を/に/で → ます verbs → past → て form …), roughly the order Genki I and Living Language use, mapped to JLPT N5 then N4. A point unlocks only once you know enough words for its examples. Each person can also add points from their textbook chapter, like chapter vocabulary. |
| New point | **A short lesson card**, like a new kana: the pattern, a 2–3 sentence explanation and 2–3 examples (tap to hear). It's offered in the same "Learn new?" prompt as words, then goes straight into easy reviews. |
| Activities (same easy-to-hard ladder) | **Fill the particle** (わたし__がくせいです → は/が/を/に) → **Pick the form** (たべる, past negative → たべませんでした) → **Build the sentence** (order shuffled word tiles to match an English sentence) → **Say/translate it** (AI-graded; arrives in M3). |
| Reference | A **Grammar list** of every point you've learned, with its explanation and examples, reachable from Journey or Settings. A "why?" link on any grammar review opens its card. |
| Journey | A mastered grammar point moves you along the Tōkaidō like a mastered word or kana. |
| Furigana | **Fades as you learn** (Chris, 2026-10-18): the reading shows above kanji on new and weak words and disappears once the word is known (stability ≥ 3 days). Tap a word to peek. Applies in sentences too. |
| AI | Stories (M3) and chat (M5) use only grammar you know, as well as your words. |

## Claude's calls (from the builder check, not discussed with Chris; change any)

- **Joining the group:** Chris's phone creates the group and gets a random code. The others join through a share link (`…/#join=<code>`) and enter a display name. The Worker keeps one small record per person under `group:<code>:<name>`. A request without a valid code gets nothing, so the Worker URL being visible in the public repo doesn't matter.
- **Kana race:** one attempt a day. You see a kana and pick its sound from 4 choices. Each wrong answer adds 3 s. The seed is the phone's local date. Times are self-reported and not checked; that's fine for three friends.
- **Kana rungs:** hear it, pick the kana → see it, pick its sound → say it (Android). Tiles start with words in M2, since one kana has nothing to build. A hint is "play the sound again"; slow means over 8 s. Both are tunable.
- **Speaking check:** the recognised text is converted to hiragana and compared loosely (a long vowel or small-kana difference still passes). After two misses the app plays the answer and grades Hard instead of Again, so bad recognition never stalls you.
- **Updates:** the iPhone web app updates itself on every open (network-first service worker). The Android app checks GitHub's latest release on open (at most every 6 h) and shows an Update banner that downloads and opens the installer in-app (`update.js`, ported from HypertroPhy). Releases must keep the same signing key.
- **Prints:** all 55 Hōeidō prints from Wikimedia Commons at 1600 px (about 32 MB), bundled so the APK works offline.
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

## M2 decisions (2026-10-18, plan grilling)

Plan: `docs/superpowers/plans/2026-10-18-m2-words-and-sentences.md` (approved by Chris 2026-10-18; build it subagent-driven, as M1 was).

| Area | Decision |
|---|---|
| NHK Easy | **Not used.** Since NHK moved it to news.web.nhk, the article list and articles need an NHK login token (401 without one), so neither the browser nor the Worker can fetch it cleanly. The reading milestone becomes **"You can read X% of Gengo's sentences"**: the share of the shipped Tatoeba sentences whose every word you know. |
| Kanji before M4 | **Kanji with furigana** (`<ruby>`) wherever a word or sentence has kanji; kana-only words stay kana. TTS speaks the reading. |
| Kana and words | **Mixed batches:** while kana remain, half of "Learn new?" is the next kana and half is words you can already spell. |
| Own words not in the dictionary | The person types the reading and meaning; it becomes a normal card without example sentences. |
| JLPT lists | Jonathan Waller's lists (CC BY) via open-anki-jlpt-decks (MIT). |

## Status (2026-10-18)

M1 "Kana together" is built and released: https://statman15.github.io/Gengo/ (iPhone, Add to Home Screen) and the signed APK on https://github.com/statman15/Gengo/releases (v1.0.2). Built subagent-driven from `docs/superpowers/plans/2026-10-17-m1-kana-together.md`, a review after every task plus a final whole-branch review.

- **Look:** "Living Hiroshige Plate" (Chris's pick). The station's print is the screen, every word sits on paper, a hanko seal is the one action; iOS and Material chrome per phone. See DESIGN.md and PRODUCT.md.
- **Group sync:** Cloudflare Worker `gengo` at https://gengo.ressler-chris.workers.dev (KV namespace GENGO, Chris's Cloudflare account). Redeploy from `worker/` with `npx wrangler deploy` (use `npx.cmd` in PowerShell). Groups cap at 20 members; records expire after 90 days without an update.
- **Android users join** from Settings > Join Group by pasting the invite link (the link itself opens Chrome, not the app).
- **Updates:** the iPhone web app updates itself on every open (network-first service worker). The Android app checks GitHub's latest release on open (at most every 6 h) and shows an Update banner that downloads and opens the installer in-app (`update.js`, ported from HypertroPhy). Releases must keep the same signing key.
- **Prints:** 55 Hōeidō scans, ~32 MB, credits in prints/CREDITS.md.
- **Still to check on real phones (M1 done-when):** speaking and TTS on Android, the Japanese voice on iPhone, group join across all three, a week of kana.

## Status (M2, 2026-10-18)

M2 "First words and sentences" is built and reviewed on branch `m2` (subagent-driven from `docs/superpowers/plans/2026-10-18-m2-words-and-sentences.md`, a review after every task plus a final whole-branch review): 19,892 JMdict words in JLPT order (usually-kana words show as kana), 10,658 Tatoeba sentences, 15 grammar points with lessons and fill/form/build drills, word drills (hear, see, read in a sentence, tiles, say), fading furigana, My words (search, paste a chapter list, custom words), the Grammar list, and coverage milestones on the Journey. Still to check on real phones: the say rung for words and a Japanese voice for TTS.

## Status (M3, 2026-10-19)

M3 "Stories" is built, decided in chat with Chris (no separate plan doc; iterate on stories once he has read a few):
- **AI connection** (`ai.js`, ported from HypertroPhy): OmniRoute / Gemini / Other, home address tried first, Gemini as the fallback when the chosen service can't be reached. Kept under its own localStorage key, so it is never in a backup and survives Start over. Android allows plain http for the OmniRoute home address.
- **Today's story** (`story.js`, `story` view): offered on Today once 5+ words are due and the AI is set up. The AI writes 4–6 kana-only lines at your current Tōkaidō station using up to 8 due words, marked 【kana|n】 and underlined. Tap a line to hear it; Show English for the whole story. Then one meaning question per marked word that is still due, each counting as that word's review (rung `read`). One story per day, cached on the phone.
- **Say/translate** (grammar rung `translate`, from stability 10, only with the AI set up): English sentence → type it, or Speak on Android → the AI grades with a corrected version and a one-line note.
- Left out: separate "hints" (tap-to-hear and Show English cover it). Still to check with a real AI and on real phones: story quality, grading, the OmniRoute home address in the APK.

## Status (M4, 2026-10-19)

M4 "Kanji" is built (Chris skipped the questions; these are Claude's calls, change any):
- **Data** (`scripts/kanji.mjs` → `data/kanji.json`, 225 KB): the 284 old-JLPT 4/3 kanji (≈ N5, N4) from KANJIDIC2 with meanings, on/kun readings and KanjiVG strokes, N5 first, then by frequency. Credits in Settings.
- **Unlock**: a kanji becomes learnable once you have a card for a word written with it; up to a quarter of each new batch (rounded down, at least one; was rounded up until 2026-10-22) is kanji. The learn card shows the kanji, meanings, on and kun readings, and up to three of your words that use it.
- **Ladder** (`kanji` in srs.js): **see** (pick the meaning) → **sound** (pick its reading: first on, else kun) at stability 3 → **trace** at 7 (`trace.js`: draw each stroke over a faint KanjiVG guide; a stroke passes when its 16 resampled points average within `TUNING.traceTolerance` = 18 of the 109-unit box, so direction counts; a miss flashes the right stroke, two misses draw it in and fail the card).
- Not changed: the furigana fade still keys on words, not kanji. Still to check on real phones: tracing with a finger, and whether 18 is too strict or too loose.

## Status (M5, 2026-10-19)

M5 "AI chat" is built, decided with Chris in chat (question cards):
- **Where:** "Chat at <station>" on Today once 3+ words are due and the AI is set up; one chat a day, cached on the phone (`gengo-chat`, not in backups), "Continue today's chat" until it is graded. It uses up to 5 due words, preferring ones today's story didn't use.
- **The chat** (`chat.js`, `chat` view): someone at your current Tōkaidō station (the AI picks: teahouse owner, porter, traveller) speaks first, kana only, polite, known grammar only, and steers 5 of your replies toward the words, which are listed at the top. Type, or Speak on Android; Enter or Send. The reply box takes focus each turn (Android opens the keyboard; iPhone needs a tap; the page can't choose the Japanese keyboard, the phone keeps the last one used).
- **Help:** tap a line to hear it, Show English, Suggest (fills in one possible kana reply).
- **Grading:** after the 5th reply the AI says per word: used right (Good; Hard if that reply came from Suggest), wrong (Again), or not used (no review, stays due), plus up to 3 corrected replies and a note. 6 AI calls per chat.
- Still to check with a real AI and on phones: whether models keep to kana, steer to the words, and grade fairly.
- **Follow-up (Chris, after first try):** a web page can't pick the phone's keyboard language, so replies (chat and Say/translate) get an in-app **kana keypad** (`keypad.js`: phone layout, ゛゜小 cycles the last kana, カナ switches script, ⌨ hands back to the phone keyboard). Stories and chats now get the list of **learned words and kana** and are told to use nothing else (plus particles, です/ます and known grammar; `limits()` in story.js). Romaji-to-kana typing is the fallback idea if the keypad is too slow.

## Learning path (2026-10-22)

Review and research: `docs/superpowers/plans/2026-10-22-learning-path.md`. Chris picked three tracks (Travel, Conversation, Whole language; chosen at the start and in Settings), hiragana first on every track while hearing and saying common phrases, then katakana; kanji only after both basic kana. Changes 1–4 are built:
- **Phrases** (`phrases.js`, ids `p-…`): 80 set phrases, everyday courtesy first, then travel. One a batch (two in a batch of 8 or 10) from the very first batch. Ladder hear → see (romaji shows until you have its kana) → say. Words a phrase already teaches (はい, ありがとう…) are skipped. Learned phrases are listed on the Kana page.
- **Spelling rules** (`rules.js`, ids `r-…`): lesson cards with drills for particle readings (は=wa, へ=e, を=o), the が/ぱ marks, small っ, small ゃゅょ, long vowels and katakana extras. Offered in `LEARN` order: 46 hiragana, the five hiragana rules, then hiragana ゛゜ woven into basic katakana (katakana no longer waits for every hiragana), then katakana ゛゜ and the katakana extras. One rule per batch, and nothing past the next rule until it is learned. A word needing small っ, ゃ, ー or ァ waits for that rule.
- **Kana hints and look-alikes** (`HINT`, `LOOK` in kana.js): a picture line on each basic kana's learn card; kana drills take wrong answers from kana you have, up to two look-alikes first (さ/ち, シ/ツ, ソ/ン…).
- **Kanji**: none until both basic kana sets are learned; the reading rung asks how one of your own words with the kanji is read (家 → いえ), falling back to the kanji's reading only if you have none.
- Existing learners keep every card; the rule cards and phrases are simply offered next.
- Next on the list: tracks (5), numbers/time/money (6), grammar to N5/N4 (7), a real frequency list (8), travel themes (9).

## Pace (2026-10-22, Chris)

Gengo follows a realistic timeline instead of offering new items without limit: **kana by about week 3, N5 basics by about month 6, N4 by about month 12** (`pace.js`). Each stage has a daily new-item budget (kana 9, N5 6, N4 4 a day), scaled by the share of answers right over the last 7 days (92%+ ×1.25, 85%+ ×1, 75%+ ×0.75, below ×0.5). Heavy review loads slow it further: with 50+ cards due within a day new items drop to 2 a day, with 100+ they pause. When the day's new items are used up, Today says "That's everything new for today" and offers **Keep practising**: recent and weak cards in the usual drills, ungraded, so the FSRS schedule is untouched. Kana take three quarters of each batch while they remain (the phrases are the spoken "common words" alongside them); words follow. The Journey shows the stage, its share done and whether you are ahead, on or behind pace. Days now also record `learned`, `graded` and `right` (kept in backups).

A year-long simulation with the real scheduler (learner recall = FSRS prediction) hit kana on day ~23, N5 by day ~170 and N4 by day ~365; a learner at ~80% of the predicted recall reached N5 by about month 10.

## Tracks (2026-10-22, Chris)

Three paths, chosen on Today before the first lesson (and once by everyone from before tracks), changeable in Settings > Path; every card and the schedule are shared, so switching keeps all progress (`tracks.js`). Hiragana, then katakana, on every path.
- **Travel**: one phrase a batch while kana remain, then two; then the 196 travel words (`travel.js`: signs, food, transport, hotel, shopping, time and places, health, taught one theme at a time in turn), then the usual order. No kanji cards (signs are learned as words, by meaning) and no automatic grammar (a point added from the Grammar list still comes). Timeline: kana ~week 3, travel set ~month 2, then N5 ~month 6.
- **Conversation**: light kanji (N5 kanji only, one a batch, no tracing); about half the word and phrase reviews become listening drills; speaking (Android) comes in at half the usual stability.
- **Whole language**: the path from before, kanji with tracing.
- Better travel glosses for 16 words on every path (急行 express (train), 会計 the bill, 高い expensive; high…).
- Year-long simulation, average learner: Travel kana day 22, travel set ~day 50, N4 by month 12; Conversation and Whole kana ~day 22, N5 ~month 6, N4 ~month 12.

## Grammar through N5 and N4 (2026-10-22)

`grammar.js` now has **89 points**: all of N5 (51: the first 15, plus こそあど, question words, と/や/から・まで/だけ/より, な-adjectives, が for likes and wants, plain and casual forms, でした, ています, permission and prohibition, て-linking, ましょう, まえに/あとで, から/けど, なる, とき, describing nouns with verbs…) and core N4 (38: potential, と思う, volitional, つもり, てみる, たことがある, たり, ながら, たら/ば/と/なら, ので/のに, んです, ほうがいい, must / don't have to, でしょう/かもしれない, そう/よう/みたい, giving and receiving, てしまう/ておく, すぎる, やすい/にくい, ために/ように, passive, causative, keigo basics, し, はず, にする). Written for Gengo, same format: a lesson with 2–3 kana examples, and fill / form / build drills. The conjugator gained the forms they drill (なかった, ています, ましょう, potential, volitional, たら, ば, passive, causative), and the form drill never offers two identical answers (たべられる is potential and passive).
- **Sentences:** Tatoeba can't be fetched from a cloud session, so `scripts/grammar-tags.mjs` tags the sentences already in `data/sentences.json` offline (60 shortest per new point; the English decides potential vs passive and にする). Points with few matches use their own examples. A full rebuild with `scripts/sentences.mjs` on a machine that can reach Tatoeba would give the newer points more sentences.
- **Pace:** a year-long simulation (average learner) learns all of N5's grammar by about month 6 and all 89 points by month 12. Travel still teaches grammar only inside phrases.

## Numbers, time and money (2026-10-22)

`numbers.js`: 13 lesson cards (ids `n-…`): 1–10, 11–99, hundreds, prices (円), thousands and まん, o'clock and half past, minutes, people (ひとり/ふたり/〜にん), things (ひとつ…とお), days of the week, months, dates (ついたち…はつか), and 本/枚. One card covers a pattern: each review draws a fresh value (a price, a time, a date) with its reading built by rule, sound changes included (さんびゃく, ろっぽん, ひゃくよえん, しちじはん, じゅうよっか). Drills: **read** (pick the reading; wrong answers are the classic mistakes like さんひゃく / いちほん plus one-digit near misses), **hear** (the phone says a price or time, pick it), **say** (Android; recognition that returns digits, kana or kanji all count). Offered one a batch on every path once all hiragana and its five spelling rules are known (about day 16); all 13 by about day 28. Travel counts the price, time, people, things, week and date lessons in its travel set. Learned lessons are listed on the Kana page.

**Batch balance (2026-10-22, from the second full test pass):** once every kana is known, at least half of each batch is words when there are words to learn; extras give way from the end (phrases, then the numbers lesson, then kanji), while the grammar point and spelling rules keep their place. Someone who already has every basic kana (from before spelling rules) gets the missing rules first, since they unlock words. Before this, an upgrading learner got 3 new words in a week (grammar, kanji, numbers, phrases and rules filled every batch); now about half of each batch.

## Station details (2026-10-22, Chris)

Tap any station on the Journey for a sheet: its print, the name in kanji and kana (`READINGS` in journey.js), what the print shows, where you stand (reached, you are here, or how many more mastered items), and **what a typical learner on your path learns on the road from that station to the next**, with roughly when they get there. The stations are the same 55 prints on every path (you move by mastered items); only what is learned between them differs, so the plan is per path: `data/journey-plan.json`, built by `scripts/journey-plan.mjs`, which simulates two years with the app's own order, pace and scheduler. **Rerun it whenever the learning order, pace or stations change.** An average learner reaches Shinagawa around day 15 (an item counts as mastered after about three weeks of reviews) and Kyoto around month 7–8, before the N4 timeline ends at month 12.
