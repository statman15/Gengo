export const FORMS = {
  masu: 'polite', masen: 'polite negative', mashita: 'polite past', masendeshita: 'polite past negative',
  te: 'て form', ta: 'plain past', nai: 'plain negative', tai: 'want to', dict: 'dictionary form',
  adj: 'polite', 'adj-neg': 'negative', 'adj-past': 'past', 'adj-past-neg': 'past negative',
};

// godan ending -> [i-row, a-row, te, ta]
const GODAN = {
  う: ['い', 'わ', 'って', 'った'], つ: ['ち', 'た', 'って', 'った'], る: ['り', 'ら', 'って', 'った'],
  む: ['み', 'ま', 'んで', 'んだ'], ぶ: ['び', 'ば', 'んで', 'んだ'], ぬ: ['に', 'な', 'んで', 'んだ'],
  く: ['き', 'か', 'いて', 'いた'], ぐ: ['ぎ', 'が', 'いで', 'いだ'], す: ['し', 'さ', 'して', 'した'],
};

const VERB = {
  masu: i => i + 'ます', masen: i => i + 'ません', mashita: i => i + 'ました', masendeshita: i => i + 'ませんでした',
  tai: i => i + 'たい',
};
const ADJ = { adj: 'です', 'adj-neg': 'くないです', 'adj-past': 'かったです', 'adj-past-neg': 'くなかったです' };

export function conjugate(word, pos, form) {
  if (!Object.hasOwn(FORMS, form)) return null;
  if (pos === 'adj-i' || pos === 'adj-ix') {
    if (!ADJ[form]) return null;
    if (form === 'adj') return word + 'です';
    const stem = pos === 'adj-ix' && word.endsWith('いい') ? word.slice(0, -2) + 'よ' : word.slice(0, -1);
    return stem + ADJ[form];
  }
  if (ADJ[form]) return null;
  if (form === 'dict') return /^(v1|v5|vk|vs-i)/.test(pos) ? word : null;
  let i, a, te, ta;
  if (pos === 'v1' || pos === 'v1-s') { const s = word.slice(0, -1); [i, a, te, ta] = [s, s, s + 'て', s + 'た']; }
  else if (pos === 'vs-i') { const s = word.slice(0, -2); [i, a, te, ta] = [s + 'し', s + 'し', s + 'して', s + 'した']; }
  else if (pos === 'vk') {
    const s = word.slice(0, -2), k = word.at(-2) === '来';
    [i, a, te, ta] = [s + (k ? '来' : 'き'), s + (k ? '来' : 'こ'), s + (k ? '来' : 'き') + 'て', s + (k ? '来' : 'き') + 'た'];
  } else if (['v5k', 'v5k-s', 'v5g', 'v5s', 'v5m', 'v5b', 'v5n', 'v5r', 'v5r-i', 'v5t', 'v5u'].includes(pos)) {
    const row = GODAN[word.at(-1)];
    if (!row) return null;
    const s = word.slice(0, -1);
    [i, a, te, ta] = [s + row[0], s + row[1], s + row[2], s + row[3]];
    if (pos === 'v5k-s') [te, ta] = [s + 'って', s + 'った'];
    if (pos === 'v5r-i') a = word.slice(0, -2); // ある -> ない
  } else return null;
  if (form === 'te') return te;
  if (form === 'ta') return ta;
  if (form === 'nai') return a + 'ない';
  return VERB[form](i);
}
