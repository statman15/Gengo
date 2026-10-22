export const FORMS = {
  masu: 'polite', masen: 'polite negative', mashita: 'polite past', masendeshita: 'polite past negative',
  te: 'て form', ta: 'plain past', nai: 'plain negative', tai: 'want to', dict: 'dictionary form',
  adj: 'polite', 'adj-neg': 'negative', 'adj-past': 'past', 'adj-past-neg': 'past negative',
  nakatta: 'plain past negative', teimasu: '〜ています', mashou: "let's (〜ましょう)", pot: 'can (potential)',
  vol: "let's (plain volitional)", tara: 'if / when (〜たら)', ba: 'if (〜ば)', pass: 'passive (is done to)', caus: 'make / let (causative)',
};

// godan ending -> e-row, o-row (potential / ば and volitional)
const ROW_E = { う: 'え', つ: 'て', る: 'れ', む: 'め', ぶ: 'べ', ぬ: 'ね', く: 'け', ぐ: 'げ', す: 'せ' };
const ROW_O = { う: 'お', つ: 'と', る: 'ろ', む: 'も', ぶ: 'ぼ', ぬ: 'の', く: 'こ', ぐ: 'ご', す: 'そ' };

// godan ending -> [i-row, a-row, te, ta]
const GODAN = {
  う: ['い', 'わ', 'って', 'った'], つ: ['ち', 'た', 'って', 'った'], る: ['り', 'ら', 'って', 'った'],
  む: ['み', 'ま', 'んで', 'んだ'], ぶ: ['び', 'ば', 'んで', 'んだ'], ぬ: ['に', 'な', 'んで', 'んだ'],
  く: ['き', 'か', 'いて', 'いた'], ぐ: ['ぎ', 'が', 'いで', 'いだ'], す: ['し', 'さ', 'して', 'した'],
};

const VERB = {
  masu: i => i + 'ます', masen: i => i + 'ません', mashita: i => i + 'ました', masendeshita: i => i + 'ませんでした',
  tai: i => i + 'たい', mashou: i => i + 'ましょう',
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
  if (form === 'tara') return ta + 'ら';
  if (form === 'teimasu') return te + 'います';
  if (form === 'nai') return a + 'ない';
  if (form === 'nakatta') return a + 'なかった';
  if (VERB[form]) return VERB[form](i);
  // potential, volitional, ば, passive, causative: by verb class (ある has none of these in everyday use)
  if (pos === 'v5r-i') return null;
  const ru = pos === 'v1' || pos === 'v1-s', s = word.slice(0, -1);
  if (pos === 'vs-i') { const b = word.slice(0, -2); return { pot: b + 'できる', vol: b + 'しよう', ba: b + 'すれば', pass: b + 'される', caus: b + 'させる' }[form] ?? null; }
  if (pos === 'vk') { const b = word.slice(0, -2), k = word.at(-2) === '来' ? '来' : null;
    return { pot: b + (k ?? 'こ') + 'られる', vol: b + (k ?? 'こ') + 'よう', ba: b + (k ?? 'く') + 'れば', pass: b + (k ?? 'こ') + 'られる', caus: b + (k ?? 'こ') + 'させる' }[form] ?? null; }
  if (ru) return { pot: s + 'られる', vol: s + 'よう', ba: s + 'れば', pass: s + 'られる', caus: s + 'させる' }[form] ?? null;
  const e = ROW_E[word.at(-1)], o = ROW_O[word.at(-1)];
  return { pot: s + e + 'る', vol: s + o + 'う', ba: s + e + 'ば', pass: a + 'れる', caus: a + 'せる' }[form] ?? null;
}
