// Kana spelling rules, each a lesson card with its own drills: particle readings, the が/ぱ marks, small っ, small ゃゅょ, long vowels,
// katakana extensions. ex: [kana, romaji] choices, the first one right. A drill shows (see) or plays (hear) the first kana
// and offers all four. Particle examples share one spelling, so that rule is see-only.
import { KANA } from './kana.js';

const E = (ks, rs) => ({ k: ks.split(' '), r: rs.split(' ') });
const P = (k, rs) => ({ k: [k, k, k], r: rs.split('/') });

export const RULES = [
  { id: 'r-particles', title: 'は へ を as particles', en: 'wa, e and o', acts: ['see'],
    explain: 'Three kana change their sound when they work as particles: は is read "wa", へ is read "e" and を is read "o". Inside ordinary words they keep their usual sound: はな is "hana", へや is "heya". Greetings such as こんにちは end in the particle は, so they end in "wa".',
    ex: [P('わたしは', 'watashi wa/watashi ha/watashi o'), P('こんにちは', 'konnichiwa/konnichiha/konnichie'), P('うちへ', 'uchi e/uchi he/uchi wa'),
      P('みずを', 'mizu o/mizu wa/mizu ho'), P('はな', 'hana/wana/ana'), P('へや', 'heya/eya/weya')] },
  { id: 'r-marks', title: 'か → が, は → ぱ', en: 'two dots and a small circle', acts: ['see', 'hear'],
    explain: 'Two small marks change a kana’s sound. Two dots make it voiced: k→g, s→z, t→d, h→b, so か "ka" becomes が "ga". A small circle goes only on the h row and makes a p: は "ha" becomes ぱ "pa". じ and ぢ both sound "ji", ず and づ both "zu"; じ and ず are the usual spellings.',
    ex: [E('が か ぱ ば', 'ga ka pa ba'), E('ざ さ ぜ じ', 'za sa ze ji'), E('だ た ば ぱ', 'da ta ba pa'), E('ば ぱ は ま', 'ba pa ha ma'),
      E('ぷ ぶ ふ う', 'pu bu fu u'), E('ご こ ぼ ど', 'go ko bo do'), E('じ し ち ぎ', 'ji shi chi gi'), E('で て べ ぜ', 'de te be ze')] },
  { id: 'r-sokuon', title: 'Small っ', en: 'a doubled consonant', acts: ['see', 'hear'],
    explain: 'A small っ doubles the next consonant: a tiny pause, then the sound. きって is "kitte" (a stamp), not "kitsute". Full-size つ is "tsu" as usual. In katakana it is ッ: ベッド "beddo", bed.',
    ex: [E('きって きつて きて きいて', 'kitte kitsute kite kiite'), E('まって まつて まて まあて', 'matte matsute mate maate'),
      E('ざっし ざつし ざし ざいし', 'zasshi zatsushi zashi zaishi'), E('いっぱい いつぱい いぱい いいぱい', 'ippai itsupai ipai iipai'),
      E('おっと おつと おと おうと', 'otto otsuto oto outo'), E('がっこう がつこう がこう ごっこう', 'gakkou gatsukou gakou gokkou')] },
  { id: 'r-youon', title: 'Small ゃ ゅ ょ', en: 'kya, shu, cho…', acts: ['see', 'hear'],
    explain: 'A small ゃ, ゅ or ょ after an i-sound kana (き し ち に ひ み り and their ゛゜ forms) blends the two into one beat: き + ゃ = きゃ "kya". Full-size きや is two beats, "ki-ya". After し, ち and じ the y drops out: しゃ "sha", ちゅ "chu", じょ "jo". Katakana works the same: キャ, シュ, チョ.',
    ex: [E('きゃ きゅ きょ きや', 'kya kyu kyo kiya'), E('しゅ しゃ しょ しゆ', 'shu sha sho shiyu'), E('ちょ ちゃ ちゅ ちよ', 'cho cha chu chiyo'),
      E('にゃ にゅ にょ にや', 'nya nyu nyo niya'), E('ひょ ひゃ ひゅ ひよ', 'hyo hya hyu hiyo'), E('りゅ りゃ りょ りゆ', 'ryu rya ryo riyu'),
      E('みゃ みゅ みょ みや', 'mya myu myo miya'), E('じゃ じゅ じょ じや', 'ja ju jo jiya'), E('ぎょ ぎゃ ぎゅ ぎよ', 'gyo gya gyu giyo')] },
  { id: 'r-long', title: 'Long vowels', en: 'aa, ii, uu, ee, oo and ー', acts: ['see', 'hear'],
    explain: 'A long vowel lasts two beats, and short or long changes the word: おばさん is aunt, おばあさん is grandmother. In hiragana an extra vowel makes it long: おかあさん "okaasan". E-sounds are usually lengthened with い (せんせい "sensei", said "sensee") and o-sounds with う (おとうさん "otousan", said "otoosan"). Katakana uses a dash: コーヒー "koohii".',
    ex: [E('おばあさん おばさん おばあさ おばっさん', 'obaasan obasan obaasa obassan'), E('おじいさん おじさん おじいさ おじっさん', 'ojiisan ojisan ojiisa ojissan'),
      E('おかあさん おかさん おかあさ おかっさん', 'okaasan okasan okaasa okassan'), E('ゆうき ゆき ゆっき ゆうきい', 'yuuki yuki yukki yuukii'),
      E('くうき くき くっき くうきい', 'kuuki kuki kukki kuukii'), E('コーヒー コヒー コーヒ コッヒー', 'koohii kohii koohi kohhii'),
      E('ケーキ ケキ ケーキー ケッキ', 'keeki keki keekii kekki')] },
  { id: 'r-kata-ext', title: 'Katakana extras', en: 'fa, ti, di, wi, che…', acts: ['see', 'hear'],
    explain: 'Katakana adds a small ァ ィ ゥ ェ ォ to write sounds Japanese didn’t have, mostly in loanwords: ファ "fa", ティ "ti", ディ "di", ウィ "wi", ウェ "we", チェ "che", シェ "she", フォ "fo". パーティー is party, フォーク is fork, チェック is check.',
    ex: [E('ファ フア ハ パ', 'fa fua ha pa'), E('ティ テイ チ テ', 'ti tei chi te'), E('ディ デイ ジ デ', 'di dei ji de'), E('ウィ ウイ イ ヴィ', 'wi ui i vi'),
      E('チェ チエ チ ジェ', 'che chie chi je'), E('シェ シエ セ ジェ', 'she shie se je'), E('フォ フオ ホ ポ', 'fo fuo ho po'), E('ウェ ウエ エ ヴェ', 'we ue e ve')] },
];

// The order kana and rules are offered in: the 46 basic hiragana, the hiragana rules, then hiragana ゛゜ woven into the
// basic katakana, then katakana ゛゜ and the katakana extras. Katakana no longer waits for every hiragana.
const ids = (script, from, to) => KANA.filter(k => k.script === script).slice(from, to).map(k => k.id);
const weave = (a, b) => { const o = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) o.push(j >= b.length || (i < a.length && i * b.length <= j * a.length) ? a[i++] : b[j++]);
  return o; };
export const BASIC = [...ids('hira', 0, 46), ...ids('kata', 0, 46)];
export const LEARN = [...ids('hira', 0, 46), 'r-particles', 'r-marks', 'r-sokuon', 'r-youon', 'r-long',
  ...weave(ids('hira', 46), ids('kata', 0, 46)), ...ids('kata', 46), 'r-kata-ext'];

// The rules a word's reading needs before it can be learned.
export const rulesFor = r => [[/[ゃゅょャュョ]/, 'r-youon'], [/[っッ]/, 'r-sokuon'], [/ー/, 'r-long'], [/[ァィゥェォヴ]/, 'r-kata-ext']]
  .filter(([re]) => re.test(r)).map(([, id]) => id);
