import { fsrs, createEmptyCard } from './vendor/ts-fsrs.js';

export const TUNING = { seeAt: 3, sayAt: 10, mastered: 21, slowMs: 8000, stretch: 0.2 };
const f = fsrs();
const ORDER = ['hear', 'see', 'say'];

export const newCard = now => createEmptyCard(now);
export const review = (card, rating, now) => f.next(card, now, rating).card;
export const isDue = (card, now) => new Date(card.due) <= now;
export const isMastered = card => card.stability >= TUNING.mastered;

export function rungFor(card, { canHear, canSay }) {
  const s = card.stability;
  const r = s >= TUNING.sayAt ? 'say' : s >= TUNING.seeAt ? 'see' : 'hear';
  return (r === 'say' && !canSay) || (r === 'hear' && !canHear) ? 'see' : r;
}

export function pickRung(card, caps, rand) {
  const rung = rungFor(card, caps);
  const up = ORDER[ORDER.indexOf(rung) + 1];
  if (up && rand() < TUNING.stretch && (up !== 'say' || caps.canSay)) return { rung: up, stretch: true };
  return { rung, stretch: false };
}

export function ratingFor({ correct, ms, hinted, stretch, speechFallback }) {
  if (!correct) return 1;
  if (hinted || speechFallback || ms >= TUNING.slowMs) return 2;
  return stretch ? 4 : 3;
}
