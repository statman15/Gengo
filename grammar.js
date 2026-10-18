// The first 15 grammar points, in teaching order. Explanations are written for Gengo (never copied from a textbook).
// Examples are kana only, tokens separated by spaces; a fill point's answer sits in [brackets].
// match(tokens) tags Tatoeba sentences: tokens are {h: headword, s: surface, f: JMdict pos ('' in our own examples)}.

const S = (ts, s) => ts.some(t => t.s === s && (t.f === '' || t.f === 'prt'));  // a particle, by surface
const J = ts => ts.map(t => t.s).join('');                                         // the sentence as one string
const last = ts => ts.filter(t => !/^[。、？！]$/.test(t.s)).at(-1)?.s;
const VERB = ['v1', 'v5', 'vk', 'vs'];

export const GRAMMAR = [
  { id: 'g-wa-desu', title: 'XはYです', en: 'X is Y', jlpt: 5, words: 10, acts: ['fill', 'build'],
    choices: ['は', 'を', 'に', 'で'], blank: 'は',
    explain: 'は (written は, pronounced "wa") marks the topic: what the sentence is about. です at the end makes it a polite "is", "am" or "are". There is no word for "a" or "the".',
    ex: [{ jp: 'わたし [は] がくせい です 。', en: 'I am a student.' }, { jp: 'たなかさん [は] せんせい です 。', en: 'Tanaka-san is a teacher.' }],
    match: ts => S(ts, 'は') && J(ts).includes('です') },

  { id: 'g-ka', title: '〜か', en: 'Questions with か', jlpt: 5, words: 15, acts: ['fill', 'build'],
    choices: ['か', 'を', 'に', 'で'], blank: 'か',
    explain: 'Put か at the end of a sentence to turn it into a question. The word order stays the same. Traditionally 。 is used instead of a question mark, though ？ is common too. Japanese often drops "you": がくせいですか can mean "Are you a student?"',
    ex: [{ jp: 'がくせい です [か] 。', en: 'Are you a student?' }, { jp: 'これ は ほん です [か] 。', en: 'Is this a book?' }],
    match: ts => last(ts) === 'か' },

  { id: 'g-no', title: 'XのY', en: "X's Y", jlpt: 5, words: 20, acts: ['fill', 'build'],
    choices: ['の', 'を', 'で', 'に'], blank: 'の',
    explain: 'の links two nouns: the first one describes or owns the second. わたしのほん is "my book"; にほんのくるま is "a Japanese car".',
    ex: [{ jp: 'これ は わたし [の] ほん です 。', en: 'This is my book.' }, { jp: 'にほん [の] くるま です 。', en: 'It is a Japanese car.' }],
    match: ts => S(ts, 'の') },

  { id: 'g-mo', title: 'XもYです', en: 'X is also Y', jlpt: 5, words: 25, acts: ['fill', 'build'],
    choices: ['も', 'を', 'で', 'へ'], blank: 'も',
    explain: 'も means "also" or "too". It takes the place of は, が or を, so you never say はも. After other particles like に or で it joins them instead: ここにも, "here too".',
    ex: [{ jp: 'わたし [も] がくせい です 。', en: 'I am a student too.' }, { jp: 'これ [も] ペン です 。', en: 'This is a pen too.' }],
    match: ts => S(ts, 'も') },

  { id: 'g-janai', title: 'じゃないです', en: 'is not', jlpt: 5, words: 30, acts: ['fill', 'build'],
    choices: ['じゃないです', 'です', 'でした', 'ます'],  // no blank: Tatoeba splits じゃ/ない, so fill uses these examples only
    explain: 'To say a noun is not something, swap です for じゃないです. じゃありません is a little more formal, and ではありません more formal still; all are polite.',
    ex: [{ jp: 'わたし は せんせい [じゃないです] 。', en: 'I am not a teacher.' }, { jp: 'これ は わたし の かさ [じゃないです] 。', en: 'This is not my umbrella.' }],
    match: ts => /じゃない|ではない|じゃありません|ではありません/.test(J(ts)) },

  { id: 'g-masu', title: '〜ます', en: 'Polite verbs', jlpt: 5, words: 40, acts: ['form', 'build'],
    forms: ['masu', 'dict', 'te', 'ta'], pos: VERB,
    explain: 'Verbs end in ます when you speak politely. The same ます form means "do" or "will do", so いきます can be "I go" or "I will go".',
    ex: [{ jp: 'まいにち コーヒー を のみます 。', en: 'I drink coffee every day.' }, { jp: 'あした がっこう へ いきます 。', en: 'I will go to school tomorrow.' }],
    match: ts => ts.some(t => /ます$/.test(t.s)) },  // Tatoeba keeps ます on the verb token (戻ります)

  { id: 'g-wo', title: '〜を〜ます', en: 'を marks the object', jlpt: 5, words: 45, acts: ['fill', 'build'],
    choices: ['を', 'の', 'へ', 'か'], blank: 'を',
    explain: 'を (said "o") marks the thing the verb acts on: what you eat, read or buy. It comes right after that thing, and the verb comes last.',
    ex: [{ jp: 'パン [を] たべます 。', en: 'I eat bread.' }, { jp: 'ほん [を] よみます 。', en: 'I read a book.' }],
    match: ts => S(ts, 'を') && J(ts).includes('ます') },

  { id: 'g-de', title: '〜で', en: 'で: where or by what', jlpt: 5, words: 50, acts: ['fill', 'build'],
    choices: ['で', 'を', 'の', 'か'], blank: 'で',
    explain: 'で marks where an action happens, or the tool or transport you use. うちでねます is "I sleep at home"; バスでいきます is "I go by bus".',
    ex: [{ jp: 'うち [で] ねます 。', en: 'I sleep at home.' }, { jp: 'バス [で] いきます 。', en: 'I go by bus.' }],
    match: ts => S(ts, 'で') },

  { id: 'g-ni', title: '〜に／へ', en: 'に: when or where to', jlpt: 5, words: 55, acts: ['fill', 'build'],
    choices: ['に', 'を', 'の', 'か'], blank: 'に',
    explain: 'に marks a point in time (at seven, on Saturday) and the place you go to. Words like あした, きのう and まいにち take no に. へ (pronounced "e") can also mark where you are heading.',
    ex: [{ jp: 'しちじ [に] おきます 。', en: 'I get up at seven.' }, { jp: 'どようび [に] うみ へ いきます 。', en: 'I go to the sea on Saturday.' }],
    match: ts => S(ts, 'に') },

  { id: 'g-masen', title: '〜ません', en: "Polite don't", jlpt: 5, words: 60, acts: ['form', 'build'],
    forms: ['masen', 'masu', 'mashita', 'te'], pos: VERB,
    explain: 'Change ます to ません to say you do not (or will not) do something. のみます becomes のみません.',
    ex: [{ jp: 'わたし は コーヒー を のみません 。', en: "I don't drink coffee." }, { jp: 'あした がっこう へ いきません 。', en: "I won't go to school tomorrow." }],
    match: ts => J(ts).includes('ません') },

  { id: 'g-mashita', title: '〜ました／ませんでした', en: 'Polite past', jlpt: 5, words: 70, acts: ['form', 'build'],
    forms: ['mashita', 'masu', 'masen', 'masendeshita'], pos: VERB,
    explain: 'For the past, ます becomes ました ("did"), and ません becomes ませんでした ("didn\'t").',
    ex: [{ jp: 'きのう えいが を みました 。', en: 'I saw a film yesterday.' }, { jp: 'きのう えいが を みませんでした 。', en: "I didn't see a film yesterday." }],
    match: ts => /ました|ませんでした/.test(J(ts)) },

  { id: 'g-ga-aru', title: 'があります／います', en: 'There is…', jlpt: 5, words: 80, acts: ['fill', 'build'],
    choices: ['が', 'を', 'で', 'の'], blank: 'が',
    explain: 'To say something is somewhere, mark it with が and end with あります for things or います for people and animals. The place comes first, with に.',
    ex: [{ jp: 'つくえ の うえ に ほん [が] あります 。', en: 'There is a book on the desk.' }, { jp: 'こうえん に いぬ [が] います 。', en: 'There is a dog in the park.' }],
    match: ts => S(ts, 'が') && (ts.some(t => ['ある', '有る', 'いる', '居る'].includes(t.h)) || /あります|います/.test(J(ts))) },

  { id: 'g-adj', title: 'い-adjectives: くない／かった', en: 'い-adjective endings', jlpt: 5, words: 90, acts: ['form', 'build'],
    forms: ['adj-neg', 'adj', 'adj-past', 'adj-past-neg'], pos: ['adj-i'],
    explain: 'To change an い-adjective, drop the final い. Add くない for "not" or かった for "was": たかい becomes たかくない (not expensive) and たかかった (was expensive). For "was not" use くなかった: たかくなかった. Add です to stay polite. いい is special (it comes from よい): よくない, よかった.',
    ex: [{ jp: 'この ほん は たかくないです 。', en: "This book isn't expensive." }, { jp: 'きのう は さむかったです 。', en: 'It was cold yesterday.' }],
    // Tatoeba splits たかく/ない and たかかっ/た, so an adj-i token ending in く or かっ counts too; verb negatives (たべなかった) never match.
    match: ts => ts.some(t => t.f === '' ? /くない|かった/.test(t.s) : /^adj-i/.test(t.f) && /(く|かっ|くない|かった)$/.test(t.s)) },

  { id: 'g-te-kudasai', title: '〜てください', en: 'Please do…', jlpt: 5, words: 100, acts: ['form', 'build'],
    forms: ['te', 'masu', 'ta', 'nai'], pos: VERB,
    explain: 'The て form of a verb plus ください is a polite request: "please do this". まって ください is "please wait". Typical て forms: たべる becomes たべて, かく becomes かいて, まつ becomes まって; the form drills practise them.',
    ex: [{ jp: 'ここ に なまえ を かいて ください 。', en: 'Please write your name here.' }, { jp: 'ちょっと まって ください 。', en: 'Please wait a moment.' }],
    match: ts => J(ts).includes('ください') },

  { id: 'g-tai', title: '〜たいです', en: 'I want to…', jlpt: 5, words: 110, acts: ['form', 'build'],
    forms: ['tai', 'masu', 'masen', 'te'], pos: VERB,
    explain: 'Replace ます with たい to say you want to do something: たべます becomes たべたい. Add です to be polite. The thing you want can take が or を. Use it for your own wants (or to ask "Do you want to…?"), not to say what someone else wants.',
    ex: [{ jp: 'すし が たべたいです 。', en: 'I want to eat sushi.' }, { jp: 'にほん へ いきたいです 。', en: 'I want to go to Japan.' }],
    match: ts => ts.some(t => t.h === 'たい' || (t.f === '' && /たい(です)?$/.test(t.s))) },
];
