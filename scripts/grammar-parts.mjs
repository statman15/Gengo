// Shared by words.mjs and sentences.mjs: is a JMdict entry grammar (particle/copula/auxiliary, or an `exp`
// that is only such pieces glued together: には, ですか, でしょう) rather than a vocabulary word?
const PARTS = 'は が を に で へ と も の か ね よ わ な だ です でした でしょう だろう ではない じゃない ではありません じゃありません ん から まで より や し て ば'.split(' ');
const segments = s => !s || PARTS.some(p => s.startsWith(p) && segments(s.slice(p.length)));
export const isGrammar = e => {
  const f = e.sense[0]?.partOfSpeech[0] || '';
  return f === 'prt' || f === 'cop' || f.startsWith('aux') || (f === 'exp' && segments(e.kana[0].text));
};
