---
name: Gengo
description: A kana trainer standing on a Hiroshige Tokaido print; washi plates carry every word and one red hanko seal is the only primary action.
colors:
  paper: "#f1ece2"
  paper-2: "#e6dfd1"
  ink: "#1c1a17"
  ink-2: "#4f4942"
  seal: "#b23a2a"
  seal-ink: "#f6efe3"
  seal-text: "#a8321f"
  tint-fallback: "#2b4c7e"
  paper-dark: "#23211d"
  paper-2-dark: "#2e2b26"
  ink-dark: "#ede6da"
  ink-2-dark: "#b9b0a2"
  seal-text-dark: "#ec8a75"
typography:
  cartouche-title:
    fontFamily: "Mincho, Hiragino Mincho ProN, Noto Serif JP, Yu Mincho, serif"
    fontSize: "1.9rem"
    fontWeight: 800
    letterSpacing: "0.12em"
  kana:
    fontFamily: "Mincho, Hiragino Mincho ProN, Noto Serif JP, Yu Mincho, serif"
    fontSize: "clamp(7rem, 38vw, 11rem)"
    fontWeight: 500
    lineHeight: 1.05
  seal-count:
    fontFamily: "Mincho, Hiragino Mincho ProN, Noto Serif JP, Yu Mincho, serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
  kana-choice:
    fontFamily: "Mincho, Hiragino Mincho ProN, Noto Serif JP, Yu Mincho, serif"
    fontSize: "2rem"
    fontWeight: 500
  choice:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Roboto, Noto Sans JP, Hiragino Sans, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Roboto, Noto Sans JP, Hiragino Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Roboto, Noto Sans JP, Hiragino Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  r: "3px"
  chip: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  plate:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
  seal:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.seal-ink}"
    size: "7.5rem"
  seal-done:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.seal-text}"
    size: "7.5rem"
  choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    height: "64px"
  choice-right:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.seal-text}"
    rounded: "{rounded.r}"
  cartouche:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "14px 9px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "28px 20px 20px"
  nav-android:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-2}"
    height: "80px"
---

# Design System: Gengo

## Overview

**Creative North Star: "The Living Hiroshige Plate"**

The current station's Hiroshige print (Hoeido Tokaido, public domain) is the app's ground, full bleed behind every screen. The interface lives on it the way the print's own furniture does: a vertical title cartouche with a thin vermilion rule, washi-paper plates, and a single red hanko seal. It refuses the study-app default of white cards, progress rings and a green Continue button.

The print is alive. Its colour follows mastery (ink sketch toward full colour), its sky band is sampled into a tint that drives the OS controls, and during review it recedes (blurred, dimmed) so one huge kana can stand on paper. Chrome is platform-adaptive: iOS conventions on iPhone, Material 3 on Android, switched in CSS by `html.ios` / `html.android`, around one shared identity. Light and dark follow the phone; in dark the paper darkens and the print dims.

**Key Characteristics:**
- Every word sits on paper; the print never carries bare text.
- One seal per screen, and it is the primary action.
- Paper is cut, not rounded (3px corners), with soft ambient shadows only.
- Mincho for kana and station names, platform face for everything else.
- Colour is rationed: paper, ink, one vermilion, and a tint borrowed from the print.

## Colors

Warm washi neutrals, sumi ink, one vermilion; the only other hue comes live from the print's sky.

### Primary
- **Hanko Vermilion** (`seal` #b23a2a): the seal fill, the cartouche rule, the progress-done bars, text selection. A fill and a rule colour, not a text colour on paper.
- **Seal Ink** (`seal-ink` #f6efe3): text and inner border on the seal.
- **Vermilion Text** (`seal-text` #a8321f; dark `seal-text-dark` #ec8a75): vermilion used as text on paper (done seal, leading streak, right-answer choice and its 良 stamp). Always this token for red text, never `seal`.

### Neutral
- **Washi** (`paper` #f1ece2; dark `paper-dark` #23211d): plates, choices, cartouche, dialog, always overlaid with the `paper.svg` grain. In dark mode a 75% dark wash sits between grain and paper.
- **Washi Shadow** (`paper-2` #e6dfd1; dark `paper-2-dark` #2e2b26): the Android nav bar surface.
- **Sumi** (`ink` #1c1a17; dark `ink-dark` #ede6da): primary text on paper.
- **Soft Sumi** (`ink-2` #4f4942; dark `ink-2-dark` #b9b0a2): secondary text, prompts, inactive nav, `.muted`.

### Tint (live)
- **Bero Blue fallback** (`tint-fallback` #2b4c7e): initial `--tint`. `tintFrom()` samples the top 15% of the print, scales it by 0.62, and rewrites `--tint` and the theme-color meta. Focus rings, the Android active-tab pill and stage backdrop use `--tint`. Tint used as text must use `--tint-text` (tint mixed 30% toward black in light, 60% toward white in dark). Never raw `--tint` for text.

### Named Rules
**The Paper Rule.** Every word sits on paper. Text placed directly on the print is wrong, whatever the contrast.
**The One Red Rule.** Vermilion fills belong to the seal, cartouche rule and progress bars; vermilion text is `--seal-text`; tinted text is `--tint-text`.

## Typography

**Display Font:** Shippori Mincho B1 subset, weights 500 and 800, self-hosted (OFL; fonts/README.md), declared as `Mincho`, falling back to Hiragino Mincho ProN, Noto Serif JP, Yu Mincho, serif. Referenced only as `var(--mincho)`.
**Body Font:** the platform face, `var(--ui)`: -apple-system / SF Pro Text, Roboto, Noto Sans JP, Hiragino Sans.

**Character:** An Edo-era mincho for the things the print would letter (kana, station names, counts, streak numbers) against a neutral native face so the app still feels like the phone it runs on.

### Hierarchy
- **Kana** (500, clamp(7rem, 38vw, 11rem), 1.05): the single review character. Set `lang="ja"`.
- **Cartouche title** (800, 1.9rem, 0.12em tracking, vertical): station kanji.
- **Seal count** (800, 3rem, tabular): due count; seal label 1.15rem 800 at 0.3em.
- **Kana choice** (500, 2rem, mincho): answer buttons that show kana.
- **Choice** (600, 1.4rem, ui): romaji answers.
- **Friend streak** (800, 1.15rem, mincho, tabular): number above a 0.8rem name.
- **Body / prompt** (400, 1rem, ui, `--ink-2`): prompts such as "Which sound?".
- **Label** (0.75rem, 0.04em, ui): cartouche romaji line; nav labels 0.7rem (iOS 0.6875rem, Android 0.75rem 500).

### Named Rules
**The Two Faces Rule.** Kana and station names are `var(--mincho)`; everything else is `var(--ui)`. No third face.

## Layout

Single column, mobile first. `.screen` is a full-height flex column (min-height 100dvh) with 16px side padding and top padding of safe-area plus 12px; flexible spacer divs (`flex:1`, `flex:.5`) push the cartouche to the top right, the seal to the lower middle and any notes (voice tip, stories and chats) to the bottom, above the nav; the friends standings live only on the Friends tab. Spacing rhythm is 4, 8, 10, 12, 16, 20px. Touch targets use `--tap` (48px; 44px on iOS, where root type also follows Dynamic Type). Review is a stack: a top bar (a round ✕ back to Today, 44px, beside the progress plate), card, then a two-column grid of choices (10px gap). Safe-area insets (`--safe-t`, `--safe-b`) are honoured at top, nav and choices. The nav is sticky at the bottom, bleeding out of the screen padding with a -16px side margin. Dialog is a bottom sheet, max 560px.

## Elevation & Depth

Depth comes from the print behind and soft ambient shadows under paper, never from hard offsets. Plates, choices and cartouche share `0 8px 22px -6px #0006`. The seal uses `drop-shadow(0 8px 14px #0006)` so the shadow follows its rough mask edge; pressed it sinks to `0 2px 4px`. The print itself recedes during review (blur 7px, saturate .7, scale 1.06, dimmer). iOS nav uses a translucent paper with backdrop blur and a .5px hairline; Android nav is a flat `paper-2` bar.

### Named Rules
**The Paper On Print Rule.** Paper floats on the print with one soft shadow; stacking plates on plates is not needed.

## Shapes

Cut paper: 3px radius (`--r`) on plates, choices and the sheet's top corners. The seal is square with a rough inked edge from `seal.svg` used as a mask, rotated -3deg, with an inset 1.5px cream border (2px radius). The cartouche is a rectangle with a 1.5px vermilion border plus a 1px vermilion inner outline offset -5px. The 良 stamp is a 26px circle, 2px border, rotated 10deg. Circles are reserved for the stamp and icon buttons; the Android nav indicator is a 64x32 pill (Material).

## Components

Paper plates, one seal, a vertical cartouche. Use these classes; do not invent substitutes.

### Stage (`stage({src, focus, sketch, recede})`, ui.js)
Sets the print behind the screen. `src` print path (prints/NN.jpg); `focus` is object-position for that print and must be tuned per print so the seal and cartouche never land on faces; `sketch` 0 to 1 (1 = ink sketch, 0 = full colour, driven by journey progress); `recede: true` for session screens so a kana can stand on paper. Calling it re-samples `--tint`. Call it first in every view's render.

### `.screen`
The per-view full-height column wrapper. Every view's markup is one `.screen`.

### `.plate`
The generic paper surface for any copy, number or control that is not covered by another class. Radius 3px, grain, soft shadow. `.muted` gives secondary text. Add `.progress` or `.card` for those roles.

### `.cartouche`
Vertical (`writing-mode: vertical-rl`) station title at the top right: `<b>` mincho kanji, `<small>` romaji and "n of 55". One per screen, home and journey-type views.

### `.seal` / `.seal.done`
The one primary action per screen: `<button class="seal"><b>count</b><span>label kanji</span></button>`. Red hanko, 7.5rem. `.seal.done` is the completed state (paper fill, vermilion-text border and label). Disabled at 50% opacity. Two seals on one screen is a defect. Needs a descriptive `aria-label`.

### `.friends`
Row at the bottom of the print: flex of `.plate` children, each a mincho streak number in `<b>` over the name. Add `.lead` to the leader to turn the number `--seal-text`.

### `.progress`
A `.plate.progress` strip of `<i>` segments (4px bars); `<i class="d">` is done (seal red). Session progress only; no rings.

### `.card`, `.kana`, `.prompt`
`.plate.card` holds one `.kana` (monumental, `lang="ja"`) and a `.prompt` line, pushed to the lower area by `margin-top:auto`. One decision on screen.

### `.choices`, `.choice`, `.kana-choice`, `.right`, `.wrong`
`.choices` is the two-column grid. `.choice` is a paper button (64px min). Use `.kana-choice` when the answer is kana (mincho 2rem). On reveal, add `.right` to the correct choice (vermilion-text inset ring and a stamped 良 mark) and `.wrong` to a missed pick (45% opacity). A correct answer is stamped, never confetti.

### `.nav` and `nav(current)` (ui.js)
Bottom nav with four tabs (Today, Journey, Friends, Settings) drawn with authored 24px stroke SVG icons. iOS (`html.ios`): translucent blurred paper tab bar, hairline top, active tab `--tint-text` weight 600. Android (`html.android`): `paper-2` 80px bar, active tab gets a 64x32 `--tint` pill indicator. Place it last inside `.screen`; omit it on session screens. OS comes from `os` in ui.js (`?os=ios|android` overrides).

### Dialog / sheet
`sheet(html)` fills the single `<dialog id="sheet">`, a bottom sheet on paper with 3px top corners. Reuse it; add no other overlay.

### `.icon-btn`
Round tap target (min `--tap`) for bare icon controls.

## Do's and Don'ts

### Do:
- **Do** put every word on a paper surface (`.plate`, `.choice`, `.cartouche`, dialog).
- **Do** give each screen exactly one `.seal` as its primary action.
- **Do** set kana and station names in `var(--mincho)` and all other text in `var(--ui)`.
- **Do** use `--seal-text` for red text and `--tint-text` for tint-derived text.
- **Do** tune each print's `focus` so the seal and cartouche stay off faces.
- **Do** use `stage({recede:true})` on session screens and pass `sketch` from progress.
- **Do** keep tap targets at `--tap` or larger and honour safe-area insets.
- **Do** leave motion on `--ease` (cubic-bezier(.16, 1, .3, 1)); reduced motion collapses all transitions.

### Don't:
- **Don't** place text on the bare print.
- **Don't** use a second primary button, white cards, progress rings, or a green Continue.
- **Don't** use `--seal` or raw `--tint` as text colour.
- **Don't** round plates beyond 3px.
- **Don't** add a third typeface or reach for system display faces for kana.
- **Don't** draw one nav for both platforms; use the `html.ios` / `html.android` rules.
- **Don't** copy the current build's carried defects: tiny nav and friend-name labels (0.6875 to 0.8rem), and the duplicated `.friends b` font rule in index.html.
