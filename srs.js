import { fsrs, createEmptyCard } from './vendor/ts-fsrs.js';

export const TUNING = {
  mastered: 21, known: 3, stretch: 0.2,
  paceScale: [[0.92, 1.25], [0.85, 1], [0.75, 0.75], [0, 0.5]], // share right this week -> daily new-item budget multiplier (pace.js)
  loadCap: 50, loadTrickle: 2, // cards due within a day: from loadCap new items slow to loadTrickle a day, from 2x they pause (pace.js)
  slowMs: { default: 8000, read: 12000, tiles: 15000, fill: 12000, form: 12000, build: 25000, translate: 60000, trace: 60000 },
  ladder: {
    kana: [['hear', 0], ['see', 3], ['say', 10]],
    rule: [['see', 0], ['hear', 3]],
    number: [['read', 0], ['hear', 2], ['say', 6]],
    phrase: [['hear', 0], ['see', 2], ['say', 6]],
    word: [['hear', 0], ['see', 2], ['read', 4], ['tiles', 7], ['say', 12]],
    grammar: [['fill', 0], ['form', 0], ['build', 5], ['translate', 10]],
    kanji: [['see', 0], ['sound', 3], ['trace', 7]],
  },
  traceTolerance: 18, // mean distance (of a 109-unit box) a traced stroke may stray from KanjiVG's
};
const f = fsrs();

export const newCard = now => createEmptyCard(now);
export const review = (card, rating, now) => f.next(card, now, rating).card;
export const isDue = (card, now) => new Date(card.due) <= now;
export const isMastered = card => card.stability >= TUNING.mastered;
export const isKnown = card => card.stability >= TUNING.known;

export function rungFor(card, ladder, can) {
  const ok = ladder.filter(([r]) => can(r));
  const fit = ok.filter(([, min]) => min <= card.stability);
  return (fit.at(-1) ?? ok[0])?.[0] ?? null;
}

export function pickRung(card, ladder, can, rand) {
  const rung = rungFor(card, ladder, can);
  const ok = ladder.map(([r]) => r).filter(can);
  const up = ok[ok.indexOf(rung) + 1];
  if (rung && up && rand() < TUNING.stretch) return { rung: up, stretch: true };
  return { rung, stretch: false };
}

export function ratingFor({ correct, ms, hinted, stretch, speechFallback, rung }) {
  if (!correct) return 1;
  if (hinted || speechFallback || ms >= (TUNING.slowMs[rung] ?? TUNING.slowMs.default)) return 2;
  return stretch ? 4 : 3;
}
