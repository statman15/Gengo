// The three learning tracks. A track only changes what "Learn new?" offers and how reviews lean; every card,
// the schedule and the journey are shared, so switching keeps all progress. Hiragana, then katakana, on every track.
import { TRAVEL_IDS } from './travel.js';

export const TRACKS = {
  travel: { name: 'Travel', short: 'Phrases, signs, menus and stations. Travel-ready in about 2 months.', blurb: 'Get around Japan: phrases, signs, menus, stations and shops. The travel set in about 2 months, then on into everyday Japanese.',
    phrases: 2, kanji: 'none', grammar: false, listen: 0, travel: true },
  talk: { name: 'Conversation', short: 'Listening and speaking first, a little kanji. N5 in about 6 months.', blurb: 'Everyday spoken Japanese: lots of listening and speaking, polite grammar, a little kanji. N5 basics in about 6 months.',
    phrases: 1, kanji: 'light', grammar: true, listen: 0.5, sayEarly: true },
  whole: { name: 'Whole language', short: 'Reading and writing too, kanji with tracing. N4 in about a year.', blurb: 'Reading and writing too: grammar, kanji with stroke tracing, JLPT order. N5 in about 6 months, N4 in about a year.',
    phrases: 1, kanji: 'full', grammar: true, listen: 0 },
};
// No choice yet (or an unknown one) behaves like Whole language, the path Gengo had before tracks.
export const trackOf = id => TRACKS[id] ?? TRACKS.whole;

// Word order for a track: Travel puts its themed words first, then the usual frequency order.
const cache = new WeakMap();
export function wordOrder(words, t) {
  if (!t.travel) return words;
  if (!cache.has(words)) { const by = new Map(words.map(w => [w.id, w])), first = TRAVEL_IDS.map(id => by.get(id)).filter(Boolean), set = new Set(TRAVEL_IDS);
    cache.set(words, [...first, ...words.filter(w => !set.has(w.id))]); }
  return cache.get(words);
}
