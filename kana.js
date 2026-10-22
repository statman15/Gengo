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

// A picture to hang each basic kana on, written for Gengo. ゛゜ forms are taught by a rule card instead (rules.js).
export const HINT = {
  あ: 'A cross with a big loop around it: "ah!", you tangled the string.', い: 'Two eels side by side: "ee".', う: 'A head bent over a sore tummy: "oo".',
  え: 'A runner leaning off the start line: "eh, go!"', お: 'Like あ with a spark flying off the top right: "oh!"',
  か: 'A karate chop with a spark beside it: "ka!"', き: 'A key with two teeth: "ki".', く: 'An open beak calling "ku-ku".',
  け: 'A post with a keg hanging beside it: "ke".', こ: 'Two short lines curled toward each other, a cosy couple: "ko".',
  さ: 'A hand saw cutting down into a curve: "sa". Its mirror twin ち opens the other way.', し: 'A fishing hook: "she" is fishing.',
  す: 'A swing with a loop in its rope: "su".', せ: 'A wide mouth saying "seh".', そ: 'A zig-zag of thread being sewn: "so".',
  た: 'Looks like the letters t and a written together: "ta".', ち: 'A cheerleader’s backwards 5: "chi". Compare さ, which opens left.',
  つ: 'A single wave: "tsu" as in tsunami.', て: 'A hand reaching out: "take it", "te".', と: 'A toe with a thorn stuck in it: "to".',
  な: 'A nun kneeling by a cross: "na".', に: 'A post with two short lines, a bent knee: "ni".', ぬ: 'Noodles on chopsticks with a loop at the end: "nu". め has no loop.',
  ね: 'A cat’s tail ending in a curl, as in neko: "ne". れ kicks out, わ curves round.', の: 'A no-entry sign: "no".',
  は: 'A post next to a little "ha" laughing.', ひ: 'A wide grin: "hee hee".', ふ: 'Mount Fuji with a cloud on top: "fu".',
  へ: 'A small hill: "hey, a hill!"', ほ: 'Like は with an extra line on top, a hoe handle: "ho".',
  ま: 'A mama with a hairpin through her bun: "ma".', み: 'Like a 21 written in one stroke: "mi".', む: 'A cow’s face with a horn: "moo".',
  め: 'An eye with a cross through it, and め means "eye". ぬ is the same with a loop.', も: 'A fishhook with two worms on it: more bait, "mo".',
  や: 'A yak’s horns: "ya".', ゆ: 'A fish swimming through a loop: "yu".', よ: 'A yo-yo hanging from a finger: "yo".',
  ら: 'A rabbit with one ear up: "ra".', り: 'Two reeds by a river: "ri".', る: 'A road that ends in a curl: "ru". ろ has no curl.',
  れ: 'Like ね but kicking out at the end: a ray swimming off, "re".', ろ: 'る without its curl, an open road: "ro".',
  わ: 'Like ね and れ but with a round back, a whale: "wa".', を: 'A person with a cross on the shoulder; said "o", and used only as a particle.',
  ん: 'Like a handwritten n: "n".',
  ア: 'An axe: "a".', イ: 'An easel leaning over: "i".', ウ: 'う with a lid on top: "u".', エ: 'Two floors joined by a lift: "e" for elevator.',
  オ: 'Someone waving both arms: "oh!"', カ: 'か without its spark: "ka".', キ: 'き without its bottom curve: a key, "ki".',
  ク: 'A cook’s ladle tilted over: "ku". ケ and タ are its cousins.', ケ: 'A K tipped on its side: "ke".', コ: 'Three sides of a box, a corner: "ko".',
  サ: 'A saddle with two posts: "sa".', シ: 'Dots stacked on the LEFT, last stroke sweeps UP: she looks up, "shi". ツ has dots on top.',
  ス: 'A person sprinting: "su".', セ: 'せ without its last stroke: "se".', ソ: 'Two strokes, the long one falling from the TOP: "so". ン rises from below.',
  タ: 'ク with an extra stroke inside: "ta".', チ: 'A cheerleader holding a pom-pom stick: "chi".',
  ツ: 'Dots across the TOP, last stroke falls DOWN: a tsunami pouring down, "tsu". シ has dots on the left.',
  テ: 'A telephone pole: "te".', ト: 'A totem pole with one branch: "to".', ナ: 'A knife over a cross: "na".',
  ニ: 'Two lines, and 二 (ni) means two.', ヌ: 'Chopsticks picking up a noodle: "nu".', ネ: 'A nest on a branch: "ne".',
  ノ: 'One slash: "no!"', ハ: 'Two lines spreading like a laugh: "ha!"', ヒ: 'A heel: "hi".', フ: 'The top of ふ, a hook: "fu".',
  ヘ: 'The same hill as へ: "he".', ホ: 'A holy cross with two dots: "ho".', マ: 'A mama’s headscarf knot: "ma".', ミ: 'Three lines for me, me, me: "mi".',
  ム: 'A cow’s nose: "mu".', メ: 'X marks the spot: "me".', モ: 'も without the hook: "mo".', ヤ: 'Like や: a yak’s horn, "ya".',
  ユ: 'A U-turn sign: "yu".', ヨ: 'A backwards E doing a yo-yo trick: "yo".', ラ: 'Like ら: a rabbit, "ra".', リ: 'Same reeds as り: "ri".',
  ル: 'Two legs, one kicking out: "ru".', レ: 'A check mark: "re".', ロ: 'A square road sign: "ro".', ワ: 'A wine glass: "wa".',
  ヲ: 'ワ with an extra bar; said "o" and rarely used.', ン: 'A short stroke, then a long one rising from the BOTTOM: "n". ソ falls from the top.',
};

// Look-alikes: a review prefers these as wrong answers once you have both, so you learn to tell them apart.
export const LOOK = ['さち', 'さき', 'ぬめ', 'ねれわ', 'るろ', 'はほま', 'いりこ', 'うらつ', 'あおめ', 'くへ', 'たな', 'しつ',
  'シツ', 'ソンリ', 'クケタワ', 'ウワフヲ', 'コユロ', 'チテナ', 'スヌフ', 'アマ', 'ノメソ', 'セサ', 'エユ', 'ハル', 'ヒト'];
