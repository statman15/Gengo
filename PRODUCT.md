# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

One set of web files that runs as an iPhone PWA (Safari, Add to Home Screen) and inside a Capacitor wrapper on Android. Chris chose (2026-10-17) to give each OS its own native feel: iOS conventions on the iPhone and Material conventions on Android. Both share the same Gengo identity (the Tōkaidō prints, the kana, the voice).

## Stack

Plain HTML/CSS/JS ES modules, no build step, no framework (copied from HypertroPhy). Deployed to GitHub Pages and as a GitHub Actions APK. See PLAN.md.

## Users

Three adult learners: Chris, his brother (both on Android) and a friend (iPhone). They study a few minutes at a time on their phones, often casually at home or on the go. Their job is to clear today's reviews and learn new kana without it feeling like a drill. All three start from kana.

## Product Purpose

Gengo keeps Anki's engine (FSRS spaced repetition) but turns every due review into a different activity: hear it, see it, say it, and later build, read in a story, or trace. Chris quit AnkiDroid because flipping the same cards got boring. He tried Renshuu too, but it felt cluttered, he had no one to study with, and progress felt invisible. Success means all three are still studying weeks later.

## Positioning

The one thing to do now, a private group of three who see each other's streaks and race at kana daily, and progress shown as a journey along Hiroshige's Tōkaidō road.

## Operating Context

Short sessions, often one-handed, sometimes with sound off (speaking and listening then fall back to reading). A weekly leaderboard resets every Monday. A kana race runs once a day. The group is joined through an invite link.

## Capabilities and Constraints

- M1: hiragana and katakana as FSRS cards; the hear, see and say activities (say is Android only); streak; Tōkaidō journey; group board; daily kana race; backup.
- All learning data stays on the phone.
- Speaking never appears on the iPhone.
- Japanese text needs a font stack with good kana rendering on both OSes.

## Brand Commitments

- Name: **Gengo** (言語).
- Hiroshige's *Fifty-three Stations of the Tōkaidō* (public domain) is the progress visual. Each station's print fades from ink sketch to full colour as you approach it.
- The home screen has one obvious next action. Clutter is the failure that killed Renshuu.

## Evidence on Hand

The 55 Tōkaidō prints (Wikimedia Commons, fetched in Task 10). No testimonials, users or metrics beyond the three people.

## Product Principles

1. One obvious next step on every screen.
2. Progress you can see and feel, not only numbers.
3. Studying together beats studying alone, but a friend's lead should never discourage you (weekly resets).
4. Variety in how you review, never in what you have to decide.

## Accessibility & Inclusion

No special needs reported. Follow the standard: readable contrast, large tap targets, honour reduced motion and the system text size, and support light and dark mode.
