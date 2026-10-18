# M2 "First words and sentences" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After kana, all three learn the most common Japanese words and the first 15 grammar points through hear / see / read / tiles / say and fill / form / build activities, read them in real Tatoeba sentences, add their own textbook words, and watch words, grammar, JLPT coverage and "sentences you can read" move them along the Tōkaidō.

**Architecture:** Two hand-run Node prep scripts turn JMdict (common subset), the JLPT lists and Tatoeba into `data/words.json` and `data/sentences.json`, which the app fetches at runtime (the service worker caches them, `copy-web.js` ships them in the APK). Grammar points are a hand-written ES module (`grammar.js`) that both the app and the sentence prep import. Every review item, kana, word or grammar point, is one FSRS card keyed by id (`h-a`, `w-1311110`, `c-1`, `g-wo`); a per-kind ladder in `srs.js` picks its activity.

**Tech Stack:** As M1: plain ES modules, no build step, ts-fsrs (vendored), Capacitor 8 + TTS/speech plugins, `node:assert` tests, puppeteer smoke, GitHub Actions + Pages. Prep scripts use Node 22 `fetch` and `node:zlib`; no new npm dependencies.

**Spec:** `PLAN.md`: the Milestones M2 line, the "Grammar" section, "Data sources", and "M2 decisions" (recorded 2026-10-18 with this plan). `DESIGN.md` for every new screen. M1's plan (`2026-10-17-m1-kana-together.md`) for the existing modules.

## Global Constraints

- No build step, no framework. New web files are native ES modules; data files are JSON fetched at runtime.
- Every feature ships to the web app (iPhone) and the APK. Speaking stays Android-only; the iPhone never shows a say rung.
- Tests: one `<module>.test.js` per pure module with `node:assert`, chained in `npm test`. `npm run smoke` passes. Before every push, load the app in the browser pane (`npx http-server -p 5173 -c-1`) and check the console.
- Word order: personal words first, then JLPT N5, N4, N3, N2, N1, then the rest of JMdict common; within a level by JMdict `nfXX` (lower first), then `news1`/`ichi1`, then entry id. Particles, copulas and auxiliaries (`prt`, `cop`, `aux`, `aux-v`, `aux-adj`) are grammar, never word cards.
- A word unlocks once every kana in its reading has a card (small kana count as their full-size kana, `ー` is ignored, `ヴ` counts as `ウ`).
- Writing: kanji with furigana (`<ruby>`) wherever a word or sentence has kanji; kana-only words stay kana. TTS always speaks the kana reading.
- "Learn new?" batch (size `db.settings.newBatch`): at most 1 grammar point (placed first), then personal words, then, while kana remain, `ceil(rest/2)` kana and the rest eligible words; whichever side runs short is filled from the other.
- A grammar point unlocks when the previous point has a card and at least `point.words` words have cards. A point the person pulls forward from the Grammar list skips both checks.
- Mastered = stability ≥ 21 days (journey, unchanged). Known = stability ≥ `TUNING.known` (3 days) (coverage and "sentences you can read").
- The "you can read X%" milestone measures Gengo's sentence library: the share of `data/sentences.json` sentences whose every word token has a known card. NHK Easy is not used (its API needs an NHK login token since the news.web.nhk move; checked 2026-10-18).
- A typed-in word not in the shipped dictionary becomes a custom word: the person types its reading and meaning (written form optional). It gets no sentences, so its read rung is skipped.
- Grading as M1, with slow thresholds per rung in `TUNING.slowMs`; opening a grammar point's "why?" during its review counts as a hint (Hard).
- `data/words.json` ≤ 2.5 MB and `data/sentences.json` ≤ 3 MB raw (PLAN.md: under 5 MB gzipped together).
- Attribution in Settings > About: JMdict (EDRDG, CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), JLPT lists by Jonathan Waller (tanos.co.uk, CC BY) via open-anki-jlpt-decks.
- Thresholds live in `TUNING` in `srs.js`; unlock word counts live on each grammar point.

## Review Focus

1. **Word data missing or out of date:** first launch offline (no `data/words.json`), or a backup holding a word id the current data no longer has. The app opens, kana sessions work, unknown ids are skipped in every queue and never crash a render. (Tests in Tasks 6 and 7.)
2. **Readings with small kana, `ー` and `ヴ`:** `きって`, `しゃしん`, `コーヒー`, `ヴァイオリン` unlock exactly when their base kana have cards. (Tests in Task 1.)
3. **An activity that can't run:** no sentence for this word, no learned verb for a form point, no Japanese voice, no speech. The ladder falls to another rung; a session never dead-ends. (Tests in Task 5.)
4. **Messy list input:** a word added twice, a word that already has a card, blank lines and unknown lines in a pasted chapter list. No duplicates; unknown lines come back for a custom entry. (Tests in Task 6.)
5. **Answers that are right but marked wrong:** two words sharing a meaning (行く/参る "to go") as choices; speech returning kanji (`学生`) for がくせい. Distractors never share the target's first gloss; speech matches the written form too. (Tests in Tasks 1 and 8.)

---

### Task 1: Word data

**Files:**
- Create: `scripts/words.mjs`, `data/words.json` (generated), `words.js`, `words.test.js`
- Modify: `package.json` (add `node words.test.js` to `test`)

**Interfaces:**
- Consumes: `KANA` (`kana.js`).
- Produces:
  - `data/words.json`: `Word[]` in learning order, where `Word = {id: 'w-<jmdict id>', r: string (first common kana reading), w: string (first common kanji form, '' if none), m: string[] (glosses of the first two senses, max 3 each), p: string (broad kind 'v'|'adj'|'n'|'x') , f: string (first JMdict pos tag of sense 1, e.g. 'v5k', 'adj-i'), j: 0-5 (JLPT level, 0 = none)}`.
  - `words.js`: `loadWords(fetchFn = fetch): Promise<Word[]>` (fetches `data/words.json` once; resolves `[]` on any failure); `kanaIds(reading: string): string[]` (KANA ids, duplicates removed); `eligible(word: {r}, cards): boolean`; `search(words: Word[], q: string): Word[]` (max 20: exact `w`/`r` matches, then prefix, then whole-word English gloss matches); `meaningChoices(word: Word, pool: Word[], rand): Word[]` (4 distinct words incl. `word`, same `p`, drawn from the 300 neighbours by order, no two sharing a first gloss).

- [ ] **Step 1: Write the failing tests**

```js
assert.deepEqual(kanaIds('きって'), ['h-ki', 'h-tsu', 'h-te']);
assert.deepEqual(kanaIds('しゃしん'), ['h-shi', 'h-ya', 'h-n']);
assert.deepEqual(kanaIds('コーヒー'), ['k-ko', 'k-hi']);
assert.deepEqual(kanaIds('ヴァイオリン'), ['k-u', 'k-a', 'k-i', 'k-o', 'k-ri', 'k-n']);
const cards = Object.fromEntries(['h-ki', 'h-tsu'].map(id => [id, {}]));
assert.equal(eligible({r: 'きって'}, cards), false);
assert.equal(eligible({r: 'きって'}, {...cards, 'h-te': {}}), true);
const W = [{id: 'w-1', r: 'がくせい', w: '学生', m: ['student'], p: 'n'}, {id: 'w-2', r: 'いく', w: '行く', m: ['to go'], p: 'v'},
  {id: 'w-3', r: 'まいる', w: '参る', m: ['to go', 'to come'], p: 'v'}, {id: 'w-4', r: 'たべる', w: '食べる', m: ['to eat'], p: 'v'},
  {id: 'w-5', r: 'のむ', w: '飲む', m: ['to drink'], p: 'v'}, {id: 'w-6', r: 'みる', w: '見る', m: ['to see'], p: 'v'}];
assert.equal(search(W, '学生')[0].id, 'w-1');
assert.equal(search(W, 'がくせい')[0].id, 'w-1');
assert.equal(search(W, 'student')[0].id, 'w-1');
assert.deepEqual(search(W, '  '), []);
for (let s = 1; s < 50; s++) {
  const c = meaningChoices(W[1], W, mulberry(s));        // mulberry: copy race.js's seeded rand into the test
  assert.equal(c.length, 4); assert.ok(c.includes(W[1])); assert.ok(!c.includes(W[2])); // 参る shares "to go"
  assert.ok(c.every(x => x.p === 'v'));
}
// the shipped file
const data = JSON.parse(readFileSync('data/words.json', 'utf8'));
assert.ok(statSync('data/words.json').size <= 2.5e6);
assert.equal(new Set(data.map(x => x.id)).size, data.length);
assert.ok(data.slice(0, 50).every(x => x.j === 5));
assert.ok(!data.some(x => ['prt', 'cop'].includes(x.f) || x.f.startsWith('aux')));
assert.ok(data.find(x => x.w === '学生' && x.r === 'がくせい'));
```

- [ ] **Step 2:** Run `node words.test.js`. Expected: FAIL (module and data missing).
- [ ] **Step 3: Write `scripts/words.mjs`** (run by hand: `node scripts/words.mjs`). It downloads the latest `jmdict-eng-common-*.json.tgz` from the scriptin/jmdict-simplified GitHub release (`api.github.com/repos/scriptin/jmdict-simplified/releases/latest`, ~1.4 MB) and `src/n5.csv` … `src/n1.csv` from `raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/`. Unpack the tgz with `node:zlib` `gunzipSync` and a minimal tar reader (one file; the 512-byte header holds the size in octal at offset 124). JLPT level per entry: match the CSV's `expression` against any kanji form (or kana form when the expression is kana) and `reading` against any kana form; the easiest level wins. Broad `p`: `v*` → `'v'`, `adj-i`/`adj-ix`/`adj-na` → `'adj'`, `n*` → `'n'`, else `'x'`. Drop entries whose sense-1 pos is a particle, copula or auxiliary. Sort per Global Constraints and write compact JSON (no indentation).
- [ ] **Step 4: Implement `words.js`.** `kanaIds`: map small kana (`ぁぃぅぇぉっゃゅょゎ` and katakana equivalents) to full size, `ヴ` to `ウ`, drop `ー`, then look each char up in `KANA` by `kana`.
- [ ] **Step 5:** Run `node words.test.js`, then `npm test`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat: JMdict common word data in JLPT/frequency order`

### Task 2: Grammar points

The content is written in the main session (Opus), then checked by a Sonnet reviewer for correct, natural Japanese and plain English. Explanations are original; never copy Genki or Living Language text.

**Files:**
- Create: `grammar.js`, `grammar.test.js`
- Modify: `package.json` (test chain)

**Interfaces:**
- Consumes: `words.js` `search` (test only).
- Produces: `GRAMMAR: Point[]` in teaching order, where `Point = {id: 'g-<slug>', title: string (the pattern, Japanese), en: string (one-line name), jlpt: 5, words: number (cards needed to unlock), acts: ('fill'|'form'|'build')[] (weak → strong), choices?: string[] (fill: the answer first, then 3 wrong options that can never also be correct), forms?: Form[] (form: the target first, then 3 distractor forms), pos?: string[] (form: JMdict pos prefixes a usable word must have), blank?: string (fill: the token to blank in Tatoeba sentences), explain: string (2–3 sentences), ex: {jp: string, en: string}[] (2–3; kana only, tokens separated by spaces, the fill target in [brackets]), match: (tokens: {h, s, f}[]) => boolean}` (Tatoeba tagging: `h` headword, `s` surface, `f` pos tag).

The 15 points (order, unlock `words`, acts):

| # | id | Pattern | words | acts |
|---|---|---|---|---|
| 1 | g-wa-desu | XはYです | 10 | fill (は; を/に/で), build |
| 2 | g-ka | 〜か (question) | 15 | fill (か; を/に/で), build |
| 3 | g-no | XのY | 20 | fill (の; を/で/に), build |
| 4 | g-mo | XもYです | 25 | fill (も; を/で/の), build |
| 5 | g-janai | じゃないです | 30 | fill (じゃないです; です/でした/ます), build |
| 6 | g-masu | 〜ます | 40 | form (masu; dict/te/ta), build |
| 7 | g-wo | 〜を〜ます | 45 | fill (を; の/へ/か), build |
| 8 | g-de | place/means で | 50 | fill (で; を/の/か), build |
| 9 | g-ni | time/destination に (へ) | 55 | fill (に; を/の/か), build |
| 10 | g-masen | 〜ません | 60 | form (masen; masu/mashita/te), build |
| 11 | g-mashita | 〜ました／ませんでした | 70 | form (mashita; masu/masen/masendeshita), build |
| 12 | g-ga-aru | XがあるYがいる | 80 | fill (が; を/で/の), build |
| 13 | g-adj | い-adjectives くないです／かったです | 90 | form (adj-neg; adj/adj-past/adj-past-neg), build |
| 14 | g-te-kudasai | 〜てください | 100 | form (te; masu/ta/nai), build |
| 15 | g-tai | 〜たいです | 110 | form (tai; masu/masen/te), build |

- [ ] **Step 1: Write the failing tests:** 15 points, unique ids, `words` strictly increasing. Every `ex` has 2–3 entries, kana only (`/^[ぁ-ゖァ-ヺー \[\]？。、]+$/`), and fill points have exactly one `[...]` per example whose content is `choices[0]`. `choices` has 4 distinct strings; `forms` has 4 distinct `Form`s. Every `match` returns true for its own examples' tokens (split on spaces, brackets removed, `{h: t, s: t, f: ''}`) and false for `[{h: '猫', s: '猫', f: 'n'}]`.
- [ ] **Step 2:** Run; expect FAIL. **Step 3:** Write `grammar.js`. **Step 4:** Sonnet review of the Japanese and English, fixes applied. **Step 5:** `npm test` PASS. **Step 6:** Commit: `feat: first 15 grammar points with lessons`

### Task 3: Sentence data

**Files:**
- Create: `scripts/sentences.mjs`, `data/sentences.json` (generated), `sentences.js`, `sentences.test.js`
- Modify: `package.json` (test chain)

**Interfaces:**
- Consumes: `data/words.json` (Task 1), `GRAMMAR[].match` (Task 2).
- Produces:
  - `data/sentences.json`: `{en: string, t: [surface: string, reading: string, wordId: string][], g: string[]}[]`. A segment's `wordId` is `'w-…'` for a word token, `''` for a grammar token (particle/copula/auxiliary) and `'.'` for punctuation. `g` lists the grammar point ids whose `match` is true.
  - `sentences.js`: `loadSentences(fetchFn = fetch): Promise<Sentence[]>` (once; `[]` on failure); `forWord(id): Sentence[]`; `forPoint(id): Sentence[]` (indexes built on load); `readable(s, known: id => boolean): boolean` (every `'w-'` segment known); `best(list, known, rand): Sentence | null` (most known words; ties random); `tokenReading(surface, head, headReading): string | null`.

- [ ] **Step 1: Write the failing tests**

```js
assert.equal(tokenReading('戻ります', '戻る', 'もどる'), 'もどります');
assert.equal(tokenReading('学生', '学生', 'がくせい'), 'がくせい');
assert.equal(tokenReading('すぐに', '直ぐに', 'すぐに'), 'すぐに');
assert.equal(tokenReading('食べた', '食べる', 'たべる'), 'たべた');
assert.equal(tokenReading('来ます', '来る', 'くる'), null); // irregular stem: sentence dropped
const s = {en: 'I am a student.', t: [['私', 'わたし', 'w-1'], ['は', 'は', ''], ['学生', 'がくせい', 'w-2'], ['です', 'です', ''], ['。', '', '.']], g: ['g-wa-desu']};
assert.equal(readable(s, id => id === 'w-1'), false);
assert.equal(readable(s, () => true), true);
assert.equal(best([s, {...s, t: s.t.slice(2)}], id => id === 'w-2', () => 0), s); // tie on 1 known: rand 0 picks the first
assert.equal(best([], () => true, Math.random), null);
// the shipped file
const data = JSON.parse(readFileSync('data/sentences.json', 'utf8'));
assert.ok(statSync('data/sentences.json').size <= 3e6);
for (const x of data.slice(0, 500)) assert.ok(x.en && x.t.length && x.t.every(([sf, , id]) => sf && typeof id === 'string'));
for (const p of GRAMMAR) assert.ok(data.filter(x => x.g.includes(p.id)).length >= 20, p.id);
```

- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3: Write `scripts/sentences.mjs`.** Downloads `downloads.tatoeba.org/exports/jpn_indices.tar.bz2`, `…/per_language/jpn/jpn_sentences.tsv.bz2` and `…/per_language/eng/eng_sentences.tsv.bz2` into the scratch folder (bz2: shell out to `tar -xjf` / `bzip2 -dk`, which Git Bash and the Ubuntu runner both have). `jpn_indices.csv` rows are `jpnId \t engId \t indices`; each index is `head(reading)[sense]{surface}~` with every part but `head` optional. For each row: resolve every index to a `words.json` entry (or to a grammar token by the JMdict pos), derive the reading with `tokenReading`, then walk the Japanese text and align each surface in order, turning anything between them into `'.'` segments only if it is punctuation. Drop the sentence on any miss, if it's over 25 characters or 10 tokens, or if its English is missing. Keep, per word, the 3 shortest sentences, and per grammar point the 60 shortest that match; write the union.
- [ ] **Step 4:** Implement `sentences.js`. `tokenReading`: split `head` into kanji stem + trailing kana okurigana; `headReading` must end with that okurigana; when `surface` starts with the stem, the reading is the stem's reading plus the rest of `surface`. No kanji in `surface` → `surface`. `来る` returns null (`// ponytail: irregular 来る stems dropped; add a stem table if too many sentences go`).
- [ ] **Step 5:** `node scripts/sentences.mjs`, then `npm test`. Expected: PASS and both size checks hold.
- [ ] **Step 6:** Commit: `feat: Tatoeba sentence library matched to words and grammar`

### Task 4: Conjugation

**Files:**
- Create: `conjugate.js`, `conjugate.test.js`
- Modify: `package.json` (test chain)

**Interfaces:**
- Produces: `FORMS: {[Form]: string}` (labels: `masu: 'polite'`, `masen: 'polite negative'`, `mashita: 'polite past'`, `masendeshita: 'polite past negative'`, `te: 'て form'`, `ta: 'plain past'`, `nai: 'plain negative'`, `tai: 'want to'`, `dict: 'dictionary form'`, `adj: 'polite'`, `adj-neg: 'negative'`, `adj-past: 'past'`, `adj-past-neg: 'past negative'`); `conjugate(word: string, pos: string, form: Form): string | null` (works on kana or kanji spellings; null for an unsupported pos/form pair).

- [ ] **Step 1: Write the failing tests**

```js
const t = (w, p, f, want) => assert.equal(conjugate(w, p, f), want, `${w} ${f}`);
t('たべる', 'v1', 'masu', 'たべます'); t('たべる', 'v1', 'te', 'たべて'); t('たべる', 'v1', 'masendeshita', 'たべませんでした');
t('のむ', 'v5m', 'te', 'のんで'); t('のむ', 'v5m', 'ta', 'のんだ'); t('かう', 'v5u', 'nai', 'かわない');
t('まつ', 'v5t', 'te', 'まって'); t('かえる', 'v5r', 'masu', 'かえります'); t('かく', 'v5k', 'te', 'かいて');
t('いく', 'v5k-s', 'te', 'いって'); t('行く', 'v5k-s', 'ta', '行った'); t('およぐ', 'v5g', 'te', 'およいで');
t('はなす', 'v5s', 'te', 'はなして'); t('しぬ', 'v5n', 'te', 'しんで'); t('あそぶ', 'v5b', 'tai', 'あそびたい');
t('ある', 'v5r-i', 'nai', 'ない'); t('する', 'vs-i', 'masu', 'します'); t('べんきょうする', 'vs-i', 'te', 'べんきょうして');
t('くる', 'vk', 'masu', 'きます'); t('くる', 'vk', 'nai', 'こない'); t('来る', 'vk', 'te', '来て');
t('たかい', 'adj-i', 'adj-neg', 'たかくないです'); t('たかい', 'adj-i', 'adj-past', 'たかかったです');
t('いい', 'adj-ix', 'adj-neg', 'よくないです'); t('たかい', 'adj-i', 'masu', null); t('ねこ', 'n', 'te', null);
```

- [ ] **Steps 2–4:** fail, implement (a table of godan endings → i/a/te/ta rows; `vs-i`/`vk`/`v5r-i`/`v5k-s`/`adj-ix` special-cased), pass. **Step 5:** Commit: `feat: verb and adjective conjugation`

### Task 5: Per-kind ladder

**Files:**
- Modify: `srs.js`, `srs.test.js`, `app.js:368` (call sites)

**Interfaces:**
- Produces (replacing M1's `rungFor`/`pickRung`):
  - `TUNING = {mastered: 21, known: 3, stretch: 0.2, slowMs: {default: 8000, read: 12000, tiles: 15000, fill: 12000, form: 12000, build: 25000}, ladder: {kana: [['hear', 0], ['see', 3], ['say', 10]], word: [['hear', 0], ['see', 2], ['read', 4], ['tiles', 7], ['say', 12]], grammar: [['fill', 0], ['form', 0], ['build', 5]]}}`.
  - `rungFor(card, ladder: [rung, minStability][], can: rung => boolean): rung` (the highest allowed rung whose min ≤ stability; if none, the lowest allowed rung; `null` if nothing is allowed).
  - `pickRung(card, ladder, can, rand): {rung, stretch}` (stretch one allowed rung up with probability `TUNING.stretch`).
  - `isKnown(card): boolean` (stability ≥ `TUNING.known`).
  - `ratingFor({correct, ms, hinted, stretch, speechFallback, rung})` (slow = `ms ≥ TUNING.slowMs[rung] ?? default`).

- [ ] **Step 1: Rewrite the M1 ladder tests to the new signature and add:**

```js
const K = TUNING.ladder.kana, all = () => true, caps = ({canHear, canSay}) => r => r === 'hear' ? canHear : r === 'say' ? canSay : true;
assert.equal(rungFor({...c, stability: 12}, K, caps({canHear: true, canSay: false})), 'see');
assert.equal(rungFor(c, K, caps({canHear: false, canSay: false})), 'see');
const Wd = TUNING.ladder.word;
assert.equal(rungFor({...c, stability: 5}, Wd, r => r !== 'read'), 'see');          // no sentence for this word
assert.equal(rungFor({...c, stability: 30}, Wd, r => r !== 'say'), 'tiles');        // iPhone
const G = TUNING.ladder.grammar;
assert.equal(rungFor(c, G, r => r !== 'form'), 'fill');
assert.equal(rungFor(c, G, r => r === 'build'), 'build');                            // no learned verb: lowest allowed
assert.equal(rungFor(c, G, () => false), null);
assert.deepEqual(pickRung({...c, stability: 5}, Wd, r => r !== 'tiles', () => 0.1), {rung: 'say', stretch: true});
assert.equal(ratingFor({correct: true, ms: 14000, rung: 'tiles'}), 3);
assert.equal(ratingFor({correct: true, ms: 9000, rung: 'see'}), 2);
assert.equal(isKnown({...c, stability: 3}), true);
```

- [ ] **Steps 2–4:** fail, implement, update `app.js` to pass `TUNING.ladder.kana` and a `can` built from `caps`, `npm test` PASS. **Step 5:** browser pane: a kana review still runs. Commit: `refactor: per-kind activity ladder`

### Task 6: Store for words, lists and milestones

**Files:**
- Modify: `store.js`, `store.test.js`

**Interfaces:**
- Produces, on `db`: `mine: {words: string[], grammar: string[]}` (ids to learn next, in added order), `custom: {[c-<n>]: {r: string, w: string, m: string[]}}`, `seen: string[]` (milestone ids already celebrated). `revive` accepts card ids matching `^h-|^k-` (known KANA ids, as now), `^w-\d+$`, `^g-[a-z-]+$`, and `c-\d+` only when `custom` has that id. Functions: `addMine(kind: 'words'|'grammar', id): boolean` (false when it's already listed or already has a card); `addCustom({r, w, m}): string` (new `c-<n>` id, also pushed to `mine.words`); `parseList(text, words): {found: Word[], unknown: string[]}` (one entry per non-blank trimmed line, exact `w` or `r` match, duplicates dropped).

- [ ] **Step 1: Write the failing tests:** `revive` keeps `w-1311110`, `g-wo`, `c-1` (with its custom entry) and drops `c-2` (no entry), `w-abc`, `g-WO`; `custom` entries without a kana `r` or with an empty `m` are dropped; `mine` lists drop non-string ids and duplicates. `addMine('words', 'w-1')` twice → second false; `addMine` for an id with a card → false. `parseList('学生\n\n がくせい \nzzz\n学生', W)` → `found` = [学生] once, `unknown` = `['zzz']`. An M1 backup (no `mine`/`custom`/`seen`) revives with empty ones.
- [ ] **Steps 2–4:** fail, implement, pass. **Step 5:** Commit: `feat: store personal lists, custom words and milestones`

### Task 7: Items and the new-item queue

**Files:**
- Create: `items.js`, `items.test.js`
- Modify: `session.js`, `session.test.js`, `package.json`

**Interfaces:**
- Consumes: `KANA`, `loadWords`, `eligible`, `GRAMMAR`, `db.custom`, `db.mine`.
- Produces:
  - `items.js`: `ready(): Promise<void>` (loads words once; never rejects); `item(id): Item | null` where `Item = {id, kind: 'kana'|'word'|'grammar', ...source fields}` (custom words are `kind: 'word'` with `custom: true`); `ladderFor(item)` (`TUNING.ladder[item.kind]`; for grammar, only the rungs in `point.acts`).
  - `session.js`: `dueQueue(cards, now)` now skips ids where `item(id)` is null (Review Focus 1); `nextNew(cards, n, {words = [], mine = {words: [], grammar: []}} = {}): string[]` per the batch rule in Global Constraints; `grammarReady(cards, mine): Point | null`.

- [ ] **Step 1: Write the failing tests:** `nextNew({}, 5)` still `['h-a','h-i','h-u','h-e','h-o']`. With cards for all 71 hiragana and words `[あお(w-1), アイス(w-2), いえ(w-3)]`, `nextNew(cards, 4, {words})` → `['k-a', 'k-i', 'w-1', 'w-3']`. With every kana carded, 5 words and `mine.words = ['c-1']`, the batch starts with `c-1`. `grammarReady` returns `g-wa-desu` once 10 word cards exist, null at 9; returns `g-ka` only after `g-wa-desu` has a card; `mine.grammar = ['g-tai']` returns `g-tai` at 0 words. A batch never holds two grammar points. `dueQueue` skips a card `w-999` that `item()` can't resolve.
- [ ] **Steps 2–4:** fail, implement, pass. **Step 5:** Commit: `feat: mixed kana, word and grammar queue`

### Task 8: Word activities

Main session first sketches the word card, sentence card and tile tray on paper plates per DESIGN.md (impeccable skill, browser pane), then Sonnet builds to that.

**Files:**
- Modify: `activities.js`, `speech.js`, `speech.test.js`, `ui.js`, `index.html` (CSS for `.ruby-word`, `.sentence`, `.tiles`, `.tray`)

**Interfaces:**
- Consumes: `meaningChoices`, `best/forWord`, `speak`, `listen`, `esc`.
- Produces:
  - `ui.js`: `ruby(w, r): string` (`<ruby>w<rt>r</rt></ruby>` when `w` has kanji, else escaped `r`); `sentenceHtml(s, markId?): string` (ruby per segment, the `markId` word wrapped in `<mark>`).
  - `speech.js`: `heardWord(alts: string[], {r, w}): boolean` (an alternative, punctuation and spaces stripped, equals `toHira(r)` after `toHira`, or equals `w`).
  - `activities.js`: `ACTS.word = {hear, see, read, tiles, say}`, each `(el, item, done, ctx)` with `done({correct, ms, hinted, speechFallback})` as M1. hear: speak `r`, pick the meaning (first gloss) from `meaningChoices`; replay = hint. see: `ruby(w, r)`, pick the meaning. read: `sentenceHtml(best(forWord(id)), id)`, pick the marked word's meaning; after answering show the English. tiles: show the meaning, build `r` from tiles (kana split with small kana joined to the one before, plus 2 distractor kana); tap a placed tile to take it back; a "hear it" button = hint. say: show the meaning, listen, `heardWord`; two misses → play it, `speechFallback`. A shared `tileTray(el, pieces, answer, done)` is used here and by Task 9's build.
  - `canWord(item, caps): rung => boolean` (hear/say per caps; read only if `forWord(item.id).length`).

- [ ] **Step 1: Write the failing tests** (`speech.test.js`): `heardWord(['学生'], {r: 'がくせい', w: '学生'})`, `heardWord(['がくせい。'], …)` and `heardWord(['ガクセイ'], …)` are true; `heardWord(['がっこう'], …)` and `heardWord([], …)` false.
- [ ] **Steps 2–3:** fail, implement. **Step 4:** browser pane: learn 3 words (temporarily give yourself all kana cards from the console), answer every rung right and wrong; ruby renders; console clean. **Step 5:** Commit: `feat: word activities with furigana and sentences`

### Task 9: Grammar lessons and activities

**Files:**
- Create: `grammar-acts.js`
- Modify: `index.html` (CSS for `.lesson`, `.blank`)

**Interfaces:**
- Consumes: `GRAMMAR`, `conjugate/FORMS`, `forPoint/best`, `tileTray`, `ruby`, `sheet`, `db.cards`, `item`.
- Produces: `lessonHtml(point): string` (title in mincho, `en`, `explain`, examples with a hear button each; used by the learn screen, the "why?" sheet and the Grammar list); `ACTS.grammar = {fill, form, build}` with the same `done` contract; `canGrammar(point, cards): rung => boolean`.
- Behaviour: **fill**: a sentence (a point example, or `best(forPoint(id))` with its `blank` token) with the target replaced by `＿＿`; choices are `point.choices` shuffled; English shown under it. **form**: a random learned word whose `f` starts with one of `point.pos`, shown as `ruby(w, r)` with the label `FORMS[target]`; choices are `conjugate` of the reading for the 4 forms; unavailable if no such word or any form is null. **build**: the English of an example or a tagged sentence of ≤ 8 tokens; tiles are its non-punctuation segments shown with ruby; correct when the joined order equals the original (`// ponytail: other valid word orders count as wrong; add accepted orders per example if it annoys`). Every grammar review shows a small "why?" link that opens `lessonHtml` in `sheet()` and marks the answer hinted.

- [ ] **Step 1:** browser pane, with test cards for 120 words: learn `g-wa-desu` (lesson card), run fill and build; learn `g-masu` and run form; "why?" opens the lesson and the answer grades Hard. Console clean.
- [ ] **Step 2:** Sonnet check: for each fill point, read 10 random tagged Tatoeba sentences with the blank in place; if a wrong choice would also be correct in any, change that point's `choices` (or tighten its `match` and re-run `scripts/sentences.mjs`).
- [ ] **Step 3:** Commit: `feat: grammar lessons with fill, form and build`

### Task 10: Sessions for every kind

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `ready`, `item`, `ladderFor`, `canWord`, `canGrammar`, `ACTS`, `nextNew`, `loadSentences`, `pickRung`, `ratingFor`.
- Behaviour: start-up awaits `ready()` before the first `show()`. Home: "Learn N new?" copy names what's in the batch ("Learn 5 new kana?", "Learn 4 new words?", "Learn 3 words and は?"). The learn screen shows per kind: the kana plate (as now), a word plate (`ruby`, meaning, tap to hear), or `lessonHtml`. `begin()` also awaits `loadSentences()`. Review resolves `item(id)`, builds `can` for its kind, and calls `ACTS[kind][rung]`; if `rungFor` returns null the card is skipped for this session (not graded). The journey's "N more kana" becomes "N more".

- [ ] **Step 1:** `npm run smoke` passes; browser pane: a fresh profile learns kana as before; a profile with all kana carded gets a mixed batch; going offline before first load still opens Today with kana only (Review Focus 1).
- [ ] **Step 2:** Commit: `feat: sessions for words and grammar`

### Task 11: My words and the Grammar list

**Files:**
- Create: `lists.js` (views `words` and `grammar`)
- Modify: `app.js` (register the views), `settings.js` (links to both, About attribution lines), `app.js` journey view (a "Grammar" plate link)

**Interfaces:**
- Consumes: `search`, `parseList`, `addMine`, `addCustom`, `GRAMMAR`, `lessonHtml`, `grammarReady`, `db.mine`, `db.cards`.
- Behaviour: **My words**: a search box (Japanese or English) listing `search` results with Add; a "Paste a list" sheet (textarea, one word per line) that adds `found` and lists each `unknown` line with an "Add your own" form (reading required, kana only; meaning required; written optional) that calls `addCustom`; the queued and learned personal words below. **Grammar list**: every point in order; learned ones open `lessonHtml` in the sheet; locked ones show "unlocks at N words" and a "Learn next" button (`addMine('grammar', id)`). Reachable from Journey and Settings.

- [ ] **Step 1:** browser pane: search `student` and `がくせい`, add it, paste a 5-line list with a blank line, a duplicate and an unknown word, add the unknown as a custom word, then see it first in "Learn new?". Pull `g-tai` forward and see it offered next.
- [ ] **Step 2:** Commit: `feat: personal word lists and the grammar list`

### Task 12: Coverage and milestones

**Files:**
- Create: `coverage.js`, `coverage.test.js`
- Modify: `app.js` (journey coverage plate; a one-time milestone sheet on Today after any station arrival), `package.json`

**Interfaces:**
- Consumes: `isKnown`, `KANA`, `GRAMMAR`, `readable`, `db.seen`.
- Produces: `coverage(cards, words, sentences): {hira, kata, n5, n4, grammar, library}` (fractions 0–1 of known items; `n5`/`n4` over `words` with that `j`; `library` = readable share of `sentences`, 0 when there are none); `MILESTONES: {id, label: string, hit: cov => boolean}[]` = All hiragana, All katakana, N5 words 25/50/75/100%, N4 words 25/50/75/100%, All 15 grammar points, and "You can read 10/25/50/75% of Gengo's sentences"; `fresh(cov, seen): Milestone[]` (hit and not in `seen`).

- [ ] **Step 1: Write the failing tests:** empty cards → all zeros, `fresh` empty. Known cards for all 71 hiragana → `hira === 1`, `fresh` includes `hira`; with `seen = ['hira']` it doesn't. Words `[{id:'w-1', j:5}, {id:'w-2', j:5}]` with `w-1` known → `n5 === 0.5`. A sentence with one known and one unknown word token → `library === 0`; both known → 1. `coverage(…, [])` has `library === 0`.
- [ ] **Steps 2–4:** fail, implement, pass. **Step 5:** browser pane: the Journey shows the coverage plate; crossing "All hiragana" shows its sheet once. **Step 6:** Commit: `feat: JLPT, grammar and reading coverage milestones`

### Task 13: Ship to both apps

- [ ] **Step 1:** `npm test` and `npm run smoke` pass. Browser pane at :5173: a full pass (kana → words → a grammar point → My words → Grammar list → Journey), console clean, on the iOS (`?os=ios`) and Android chrome.
- [ ] **Step 2:** `npm run sync`; build a debug APK on the emulator; TTS speaks a word and a sentence; `say` recognises a word.
- [ ] **Step 3:** Update PLAN.md Status (M2 built) and add any open items to PARKING_LOT.md. Commit, push `main`.
- [ ] **Step 4 (Haiku):** confirm the Pages build serves the new code (`data/words.json` loads from the Pages URL) and the Android workflow published a signed release.

### Task 14: Three-phone check

- [ ] **Step 1 (Chris and the others):** each updates (APK banner / reopen the iPhone app), learns a word batch and a grammar point, adds one textbook word, and checks that the board still shows everyone. Use the hand-off tool for these steps.
- [ ] **Step 2:** Note what broke in PLAN.md; mark M2 ✅ once the done-when holds: all three are learning words and grammar and see their reading % move.
