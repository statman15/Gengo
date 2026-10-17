// Kana table: 71 hiragana + the same 71 katakana, built from sound rows.
// Order: gojuon (46), dakuten (20), handakuten (5). ぢ/づ get ids h-ji2 / h-zu2.
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const SOUNDS = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po'.split(' ');
const seen = new Set();
const make = (script, shift) => [...HIRA].map((h, i) => {
  const sound = SOUNDS[i];
  let id = `${script[0]}-${sound}`;
  if (seen.has(id)) id += '2';
  seen.add(id);
  return { id, kana: String.fromCharCode(h.charCodeAt(0) + shift), sound, script };
});
export const KANA = [...make('hira', 0), ...(seen.clear(), make('kata', 0x60))];
