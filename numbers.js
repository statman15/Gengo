// Numbers, time and money: 13 lesson cards. Each review draws a fresh value (a price, a time, a date) from the lesson,
// so one card covers a whole pattern. read(n) is the reading, show(n) what is written, naive(n) the usual mistakes
// (さんひゃく for 300, いちほん for 1本), alt(n) other correct readings that must never appear as wrong answers.

const D = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const H = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
const T = ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん'];

// The reading of 0..99,999. naive: every digit read plainly, without the sound changes (the classic mistake).
export function yomi(n, naive = false) {
  if (n === 0) return 'ぜろ';
  let out = '';
  const man = Math.floor(n / 10000);
  if (man) { out += yomi(man, naive) + 'まん'; n %= 10000; }
  const [th, hu, te, on] = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  out += naive ? (th ? (th === 1 ? '' : D[th]) + 'せん' : '') : T[th];
  out += naive ? (hu ? (hu === 1 ? '' : D[hu]) + 'ひゃく' : '') : H[hu];
  out += te ? (te === 1 ? '' : D[te]) + 'じゅう' : '';
  return out + (on ? D[on] : '');
}

const fmt = n => n.toLocaleString('en-US');
const JI = ['', 'いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ', 'じゅういちじ', 'じゅうにじ'];
const FUN = ['', 'いっぷん', 'にふん', 'さんぷん', 'よんぷん', 'ごふん', 'ろっぷん', 'ななふん', 'はっぷん', 'きゅうふん'];
export const fun = m => m < 10 ? FUN[m] : (Math.floor(m / 10) === 1 ? '' : D[Math.floor(m / 10)]) + (m % 10 ? 'じゅう' + FUN[m % 10] : 'じゅっぷん');
const TSU = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];
const HON = ['', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'];
const DAY = { 1: 'ついたち', 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか', 14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか' };
export const nichi = d => DAY[d] ?? yomi(d).replace(/なな$/, 'しち').replace(/きゅう$/, 'く') + 'にち';
export const gatsu = m => ({ 4: 'しがつ', 7: 'しちがつ', 9: 'くがつ' })[m] ?? yomi(m) + 'がつ';
const WEEK = [['にちようび', '日曜日', 'Sunday'], ['げつようび', '月曜日', 'Monday'], ['かようび', '火曜日', 'Tuesday'], ['すいようび', '水曜日', 'Wednesday'],
  ['もくようび', '木曜日', 'Thursday'], ['きんようび', '金曜日', 'Friday'], ['どようび', '土曜日', 'Saturday']];
const MONTH = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const yo = s => s.replace(/よん$/, 'よ'); // 4 before 円 and 人 is よ

const pick = (rand, a) => a[Math.floor(rand() * a.length)];
const int = (rand, lo, hi, step = 1) => lo + step * Math.floor(rand() * ((hi - lo) / step + 1));

export const NUMBERS = [
  { id: 'n-digits', title: '1 to 10', en: 'いち, に, さん…',
    explain: 'ぜろ 0, いち 1, に 2, さん 3, よん 4, ご 5, ろく 6, なな 7, はち 8, きゅう 9, じゅう 10. 4, 7 and 9 also have short readings (し, しち, く) used in times and dates; for counting, よん, なな and きゅう are the safe choice.',
    ex: [3, 4, 7, 9], gen: r => int(r, 0, 10), show: String, read: n => yomi(n), alt: n => ({ 0: ['れい'], 4: ['し'], 7: ['しち'], 9: ['く'] })[n] ?? [] },
  { id: 'n-tens', title: '11 to 99', en: 'じゅういち…きゅうじゅうきゅう',
    explain: 'Tens are a digit plus じゅう: にじゅう 20, さんじゅう 30. Add the ones after: よんじゅうなな 47. 11 to 19 are じゅう plus the digit: じゅうご 15.',
    ex: [15, 20, 47, 99], gen: r => int(r, 11, 99), show: String, read: n => yomi(n) },
  { id: 'n-hundreds', title: 'Hundreds', en: 'ひゃく, さんびゃく, ろっぴゃく',
    explain: '100 is ひゃく (not いちひゃく). Three hundreds change their sound: さんびゃく 300, ろっぴゃく 600, はっぴゃく 800. The rest are regular: にひゃく, よんひゃく, ごひゃく, ななひゃく, きゅうひゃく.',
    ex: [100, 300, 600, 850], gen: r => int(r, 100, 999), show: String, read: n => yomi(n), naive: n => [yomi(n, true)] },
  { id: 'n-yen', title: 'Prices', en: '〜えん', travel: true,
    explain: 'Yen is えん: ひゃくえん ¥100, さんびゃくごじゅうえん ¥350. A price ending in 4 says よえん, not よんえん. Prices are written 1,280円 with 円 after the number. To ask: いくらですか.',
    ex: [100, 350, 1280, 3000], gen: r => int(r, 100, 9800, 10), show: n => fmt(n) + '円', read: n => yo(yomi(n)) + 'えん', naive: n => [yomi(n, true) + 'えん', yomi(n) + 'えん'] },
  { id: 'n-thousands', title: 'Thousands and まん', en: 'せん, さんぜん, いちまん',
    explain: '1,000 is せん. Two thousands change: さんぜん 3,000, はっせん 8,000. Japanese counts in ten-thousands: いちまん is 10,000, so 35,000 is さんまんごせん (3 まん and 5 せん), and 100,000 is じゅうまん.',
    ex: [1000, 3000, 8000, 35000], gen: r => pick(r, [int(r, 1000, 9900, 100), int(r, 10000, 99000, 1000), int(r, 1000, 99999)]), show: fmt, read: n => yomi(n), naive: n => [yomi(n, true)] },
  { id: 'n-ji', title: "O'clock and half past", en: '〜じ, 〜じはん', travel: true,
    explain: 'Hours are a number plus じ. Learn three: よじ 4 o\'clock, しちじ 7, くじ 9. Half past is はん: よじはん 4:30. ごぜん is a.m. and ごご p.m.: ごご さんじ, 3 p.m. To ask: なんじですか.',
    ex: [[4, 0], [7, 0], [9, 30], [12, 0]], gen: r => [int(r, 1, 12), pick(r, [0, 30])], show: ([h, m]) => `${h}:${m ? '30' : '00'}`, read: ([h, m]) => JI[h] + (m ? 'はん' : ''),
    naive: ([h, m]) => [yomi(h) + 'じ' + (m ? 'はん' : '')], alt: ([h, m]) => m ? [JI[h] + 'さんじゅっぷん'] : [] },
  { id: 'n-fun', title: 'Minutes', en: '〜ふん, 〜ぷん', travel: true,
    explain: 'Minutes are ふん or ぷん: いっぷん 1, にふん 2, さんぷん 3, よんぷん 4, ごふん 5, ろっぷん 6, ななふん 7, はっぷん 8, きゅうふん 9, じゅっぷん 10. A time is hour, then minutes: さんじ じゅうごふん, 3:15.',
    ex: [[3, 15], [8, 10], [10, 45], [6, 5]], gen: r => [int(r, 1, 12), pick(r, [5, 10, 15, 20, 25, 35, 40, 45, 50, 55])], show: ([h, m]) => `${h}:${String(m).padStart(2, '0')}`,
    read: ([h, m]) => JI[h] + fun(m), naive: ([h, m]) => [JI[h] + yomi(m) + 'ふん', yomi(h) + 'じ' + fun(m)] },
  { id: 'n-nin', title: 'People', en: 'ひとり, ふたり, 〜にん', travel: true,
    explain: 'One and two people are special: ひとり, ふたり. From three it is a number plus にん: さんにん. Four is よにん. At a restaurant: ふたりです, "two of us".',
    ex: [1, 2, 4, 7], gen: r => int(r, 1, 10), show: n => n + '人', read: n => ({ 1: 'ひとり', 2: 'ふたり' })[n] ?? yo(yomi(n)) + 'にん',
    naive: n => [yomi(n) + 'にん'], alt: n => ({ 7: ['しちにん'] })[n] ?? [] },
  { id: 'n-tsu', title: 'Things: ひとつ…とお', en: 'counting things', travel: true,
    explain: 'For counting most things, or when you don\'t know the counter, use the native numbers: ひとつ, ふたつ, みっつ, よっつ, いつつ, むっつ, ななつ, やっつ, ここのつ, とお. Ordering: これを ふたつ ください, "two of these, please".',
    ex: [1, 2, 3, 8], gen: r => int(r, 1, 10), show: n => n + 'つ', read: n => TSU[n], naive: n => [yomi(n) + 'つ'] },
  { id: 'n-youbi', title: 'Days of the week', en: 'げつようび…', travel: true,
    explain: 'Each day is a nature word plus ようび: にち (sun) Sunday, げつ (moon) Monday, か (fire) Tuesday, すい (water) Wednesday, もく (wood) Thursday, きん (gold) Friday, ど (earth) Saturday. Shop signs often show just the first kanji: 月 for Monday.',
    ex: [1, 3, 5, 0], gen: r => int(r, 0, 6), show: n => WEEK[n][2], read: n => WEEK[n][0], kanji: n => WEEK[n][1] },
  { id: 'n-gatsu', title: 'Months', en: 'いちがつ…じゅうにがつ',
    explain: 'Months are just a number plus がつ: いちがつ January, じゅうにがつ December. Three use the short readings: しがつ April, しちがつ July, くがつ September.',
    ex: [1, 4, 7, 9], gen: r => int(r, 1, 12), show: n => `${n}月 (${MONTH[n]})`, read: gatsu, naive: n => [yomi(n) + 'がつ'] },
  { id: 'n-nichi', title: 'Dates', en: 'ついたち, ふつか…', travel: true,
    explain: 'The 1st to the 10th have their own words: ついたち, ふつか, みっか, よっか, いつか, むいか, なのか, ようか, ここのか, とおか. After that it is a number plus にち, except the 14th じゅうよっか, the 20th はつか and the 24th にじゅうよっか. A date: しがつ ふつか, April 2nd.',
    ex: [1, 2, 10, 20], gen: r => int(r, 1, 31), show: n => `${n}日`, read: nichi, naive: n => [yomi(n) + 'にち'] },
  { id: 'n-hon-mai', title: 'Long and flat things', en: '〜ほん, 〜まい',
    explain: '本 counts long things (bottles, pens, trains): いっぽん, にほん, さんぼん, よんほん, ごほん, ろっぽん, ななほん, はっぽん, きゅうほん, じゅっぽん. 枚 counts flat things (tickets, plates, shirts) and stays regular: いちまい, にまい, さんまい.',
    ex: ['1本', '3本', '6本', '2枚'], gen: r => (r() < 0.6 ? int(r, 1, 10) + '本' : int(r, 1, 10) + '枚'), show: String,
    read: s => s.endsWith('本') ? HON[parseInt(s)] : yomi(parseInt(s)) + 'まい', naive: s => s.endsWith('本') ? [yomi(parseInt(s)) + 'ほん'] : [] },
];

// A near miss for a plain number: one digit changed, same length (359 -> 379), so a choice can't be ruled out from its
// first sound. Other values (times, counters) have none.
const near = (v, rand) => { if (typeof v !== 'number' || v < 10) return null;
  const s = String(v), i = Math.floor(rand() * s.length), d = (+s[i] + 1 + Math.floor(rand() * 8)) % 10;
  return i === 0 && d === 0 ? null : +(s.slice(0, i) + d + s.slice(i + 1)); };

// Up to 4 readings for a value: the right one, the lesson's usual mistakes, near misses, then other values' readings.
// Never one of the value's other correct readings, never a repeat.
export function readingChoices(L, v, rand) {
  const right = L.read(v), bad = new Set([right, ...(L.alt?.(v) ?? [])]), out = [right];
  const add = x => { if (out.length < 4 && x && !bad.has(x) && !out.includes(x)) out.push(x); };
  (L.naive?.(v) ?? []).slice(0, 1).forEach(add);
  for (let i = 0; i < 6 && out.length < 3; i++) { const w = near(v, rand); if (w != null) add(L.read(w)); }
  for (let i = 0; i < 40 && out.length < 4; i++) add(L.read(L.gen(rand)));
  return shuffle(out, rand);
}
// Up to 4 written values for "which did you hear?": the right one, near misses, then others whose reading differs.
export function shownChoices(L, v, rand) {
  const right = L.show(v), said = new Set([L.read(v), ...(L.alt?.(v) ?? [])]), out = [right];
  const add = w => { const s = w != null && L.show(w); if (s && out.length < 4 && !out.includes(s) && !said.has(L.read(w))) out.push(s); };
  for (let i = 0; i < 6 && out.length < 3; i++) add(near(v, rand));
  for (let i = 0; i < 60 && out.length < 4; i++) add(L.gen(rand));
  return shuffle(out, rand);
}
const shuffle = (a, rand) => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };

// Did speech recognition hear this value? Phones often return digits (350円, 3時15分) or kanji (月曜日), sometimes kana.
const digits = s => s.replace(/[^0-9]/g, '');
export function heardNumber(alts, L, v) {
  const ok = new Set([L.read(v), ...(L.alt?.(v) ?? [])]), d = digits(L.show(v)), k = L.kanji?.(v);
  return alts.some(a => { const b = a.replace(/[\s,、。]/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
    return ok.has(b) || (d && digits(b) === d) || (k && b.includes(k)); });
}
