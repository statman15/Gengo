# Learning path review (2026-10-22)

The question: what order of kana, kanji, words and grammar gives the most Japanese for the time spent, how does Gengo compare today, and should there be separate tracks (whole language, conversation, travel)? Changes 1–5 are built (and travel themes from 9); 6–8 are still proposals. Pace was added on top (PLAN.md "Pace").

## What the evidence says

There are no controlled studies on "the best order for Japanese" as a whole. The strong evidence is general and applies directly:

1. **Frequency first.** The most common ~1,000 words carry most of any text or conversation, and every later thousand adds much less (Nation; Hu & Nation 2000 put comfortable reading at 95–98% of running words known). The most common ~500 kanji cover roughly three quarters of the kanji in print and ~1,000 about 90% (Kanō 2017, via Kandrac 2022). So: common words and kanji early, rare ones never before common ones.
2. **Chunks before rules.** Fixed phrases (すみません, 〜をください, 〜はどこですか) are learned and used whole long before learners can analyse them (Wray's formulaic-language work; the Lexical Approach). For speaking, especially travel, a phrase is the unit, not the word.
3. **Retrieval and spacing.** Testing yourself beats rereading, and spaced reviews beat cramming. Gengo already does this well with FSRS and quiz-style activities.
4. **Learn in small blocks, then interleave.** Brand-new characters need a short blocked introduction; once a handful are known, mixing them (especially look-alikes such as さ/ち, ぬ/め, シ/ツ, ソ/ン) improves discrimination and long-term retention.
5. **Picture mnemonics (dual coding).** Pairing a new character with a picture-and-sound story speeds up kana and kanji learning for adults; it is what Tofugu, WaniKani and Heisig all rely on.
6. **Kana first, fast.** Every curriculum and guide agrees: both kana in the first 2–3 weeks. Hiragana first for the whole language (particles, verb endings); katakana is the quicker win for travel (menus, signs and loanwords readable as English once you know the conventions).
7. **Kanji through words you already know.** Learning a kanji as part of a known word (meaning + the reading used in that word) beats memorising isolated on/kun reading lists. Components help: kanji built from parts you know stick better (the WaniKani/Heisig idea), but strict radical-first order delays useful kanji, so a blend of frequency and simplicity is best.

## How Gengo orders things today

Simulated from `nextNew` (batch of 5, a brand-new learner, `session.js`):

| Batch | New items |
|---|---|
| 1 | あ い う え お |
| 2 | か き く · いいえ · 家 |
| 3 | **[家] kanji card** · け こ · 行く 買う |
| 8 | **<XはYです>** · [木] [父] · と · 上 |
| 12 | ひ ふ · **はい** · その |
| 25 | だ ぢ づ · それ いる |
| ~33 | katakana begins |
| 60 | [海] · バ ビ · ドア 降る |

What works: FSRS, the activity ladder, kana gating words, words unlocking kanji, grammar unlocking after enough words, the AI story and chat that only use what you know.

What the research says is off:

| # | Problem today | Why it matters |
|---|---|---|
| A | **Kana order decides word order.** Words appear only when every kana is carded, so the starter phrases are scattered: はい arrives at batch 12, ありがとう / すみません wait for が/ま, and the first words are whatever is spellable (家, 行く, 買う) rather than the most useful. | Breaks principle 1 and 2. A traveller can't say "thank you" for days. |
| B | **Kanji start at batch 3**, before the learner knows half the hiragana, and take up to a quarter of every batch from then on. | Too heavy too early; kanji readings are taught before the kana to write them. |
| C | **Kanji readings are isolated:** the "sound" rung asks the first on'yomi (else kun), not the reading in your word. 家 asks か, but you learned it as いえ. | Breaks principle 7. |
| D | **No yōon or spelling rules:** きゃ/しゅ/ちょ, small っ, long vowels (ー, おう, えい), the particle readings は=wa, へ=e, を=o, and katakana extensions (ファ, ティ, ウィ, ヴ) are never taught; words using them just unlock silently. | These appear in a large share of common words (しゃしん, きって, ちょっと, コーヒー). |
| E | **Katakana waits for all 71 hiragana including dakuten** (~33 batches). Grammar examples already use コーヒー, パン, バス, ペン. | Delays loanwords, the easiest vocabulary an English speaker has. |
| F | **Kana have no mnemonic or look-alike contrast** on the learn card; new kana come in gojūon order, 2–3 a batch, blocked by row. | Principle 4 and 5. |
| G | **Only 15 grammar points**, all N5 and all polite. JLPT N5 is ~80 points and N4 ~130; there is no plain/casual form, no て-form chains, no counters, no adjectives+nouns (な), no "want/like/can". | The AI chat and stories are fenced in by this tiny grammar set. |
| H | **Word order within a level** uses counts from our own 10k Tatoeba sentences (the parking-lot item). | A real frequency list (spoken where possible) orders N5/N4 better. |
| I | **One path for everyone.** A traveller and a JLPT learner get the same order. | You asked for tracks; the research supports different orders for different goals. |
| J | **Numbers, counters, time and money** aren't taught as a unit. | Essential for travel and daily life; JMdict alone gives them as scattered words. |

## Proposed tracks

One set of cards and one FSRS engine. A **track** only changes what "Learn new?" offers next and how much of each kind; you can switch any time and keep everything learned. The Tōkaidō journey, streak and group board stay the same.

### 1. Travel (2–6 weeks, then switch)
Goal: get around Japan politely, order, buy, ask the way, read signs and menus.
- **Hiragana first, with phrase cards spoken alongside it** (hear → pick the meaning; then say it). ~120 phrases: greetings, please/thanks/sorry, yes/no, "I don't understand", "English OK?", numbers to 10,000 and prices, 〜をください, 〜はどこですか, 〜ありますか, いくらですか, 〜でおねがいします, allergies, help.
- Katakana straight after hiragana (menus, loanwords), with travel loanwords pulled forward.
- **Travel words** in themed sets: food and drink, transport and stations, hotel, shopping, directions, time.
- **Sign kanji, meaning only** (~60): 入口 出口 男 女 駅 東西南北 円 営業中 準備中 禁煙 非常口 お手洗い, line names on station boards. No tracing, no readings.
- Grammar only as chunks inside phrases.

### 2. Conversation (everyday spoken Japanese, ~6–12 months)
Goal: hold real conversations with people.
- Hiragana then katakana fast (2–3 weeks), phrase cards from day 1.
- **Spoken-frequency word order**, listening and speaking rungs weighted higher.
- Grammar through **N4, polite and casual** (です/ます first, then plain forms and casual speech), て-form, potential, want/like, giving and receiving.
- Kanji light: recognise the ~300 most common in words you know, readings via words, tracing off by default.
- AI chat as the main "boss" activity.

### 3. Whole language (reading and writing, JLPT N5 → N1, years)
Goal: read and write Japanese.
- Hiragana (with yōon and rules) → katakana → words by frequency within JLPT level; this is today's path, fixed.
- **Kanji start after both kana**, through words you know, ordered by frequency blended with simplicity (parts you know first), up to the 2,136 jōyō over time, tracing on.
- Grammar through N5 → N4 → N3 and beyond.
- Stories and the "you can read X% of sentences" milestone are the main motivators.

## Changes, in the order I'd build them

| # | Change | Fixes | Size |
|---|---|---|---|
| 1 | **Phrase cards**: a new item kind (`p-…`), ~120 hand-written travel and social phrases with English and audio. They are offered alongside hiragana from the first batch: the hear and say rungs work before the kana are known, and the reading rungs unlock once they are. Replaces today's STARTER list. | A, I | M |
| 2 | **Kana fixes**: katakana starts once the 46 basic hiragana are carded (dakuten rows interleave with katakana); a one-screen **rule card** before dakuten (゛ turns k→g, s→z, t→d, h→b; ゜ h→p); new **yōon/small っ/long vowel/particle reading** lesson cards with drills; katakana extension sounds. | D, E | M |
| 3 | **Kana mnemonics and look-alikes**: a short picture-and-sound line on each kana learn card (written for Gengo); the see/hear rungs pull distractors from look-alikes once both are known. | F | S |
| 4 | **Kanji gate and readings**: no kanji until both basic kana sets are carded; the "sound" rung asks the kanji's reading **in one of your words** (家 in 家 → いえ), on'yomi only once you know a word using it; per track, cap kanji share and order by frequency + simplicity. | B, C | S |
| 5 | **Tracks**: a Travel / Conversation / Whole language choice at first launch and in Settings. Each is a small config: weights for phrases/kana/words/kanji/grammar in `nextNew`, how early travel loanwords come, which word list or themes come next, kanji mode (signs / light / full), and which rungs are weighted up. | I | M |
| 6 | **Numbers, time and money module**: numbers 1–10,000, prices, times, dates, and the common counters (つ, 人, 枚, 本, 円, 時, 分) as their own small items with a "say the price" drill. | J | M |
| 7 | **Grammar to full N5, then N4**: ~65 more points written for Gengo in the existing format, including plain forms and casual speech for the Conversation track. The AI story/chat rules pick them up automatically. | G | L (mostly writing, can go in batches of 15) |
| 8 | **Real frequency order**: rebuild `data/words.json` ordering with an open frequency list (jiten.moe CC BY-SA 4.0, same licence as JMdict, or the Leeds list CC BY 2.5 on Wiktionary). Spoken/subtitle frequency for Conversation and Travel, written for Whole language. | H | S |
| 9 | **Travel themes**: tag words with themes (food, transport, hotel, shopping, directions) so the Travel track can pull a theme at a time; a "Before your trip" milestone on the journey. | I | S |

Build order reasoning: 1–4 help every learner on every track today and are mostly contained in `session.js`, `kana.js`, `activities.js` and new data; 5 needs them to exist; 6–9 fill in content.

Each change ships to both apps (same web files); nothing here is Android-only. Say rungs stay Android-only as today.

## Decided (Chris, 2026-10-22)

- **Tracks:** all three, chosen at the start of learning and changeable in Settings.
- **Order for every track:** hiragana first, while hearing and saying basic common words and phrases; then katakana. (So no katakana-first even for Travel.)
- **Kanji:** start only after both basic kana sets are known.
- **First build:** changes 1–4 (phrase cards, kana fixes, kana mnemonics and look-alikes, kanji gate and readings). **Built 2026-10-22**, see PLAN.md "Learning path".

Still open: existing users (you three) keep their cards and get the new order from here, with the yōon and rule cards offered next. That's my pick, with no reset.

## Sources

- [Hu & Nation coverage thresholds, cited in JALT 2021](https://jalt-publications.org/sites/default/files/pdf-article/jalt2021-pcp-024.pdf)
- [How reliable are kanji frequency databases? (Kandrac 2022, citing Kanō 2017)](https://www.japanesestudies.org.uk/ejcjs/vol22/iss2/kandrac.html)
- [Nihongo-Pro kanji frequency (top 500 ≈ 75%)](https://www.nihongo-pro.com/kanji-pal/list/kanken/1/frequency)
- [Interleaving and retrieval practice review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8476370)
- [IES: study strategies that work](https://ies.ed.gov/blogs/research/post/resolve-to-study-effectively-in-2018)
- [8020 Japanese: when to learn hiragana, katakana, kanji](https://8020japanese.com/?p=2802)
- [Japanese for beginners (kana in 2–3 weeks)](https://kanadojo.com/academy/japanese-for-beginners-how-to-start)
- [WaniKani community: radical-first vs frequency order](https://community.wanikani.com/t/wk-keeps-teaching-vocabkanjiradical-instead-of-radicalkanjivocab/61665)
- [JapanesePod101: survival phrases before traveling](https://www.japanesepod101.com/learn-japanese-before-traveling/)
- [jiten.moe frequency dictionaries (CC BY-SA 4.0)](https://jiten.moe/frequency-dictionaries)
- [Wiktionary: Japanese frequency lists](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Japanese)
- [NINJAL BCCWJ frequency list](https://clrd.ninjal.ac.jp/bccwj/en/freq-list.html)
