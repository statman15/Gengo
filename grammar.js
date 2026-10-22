// Grammar points in teaching order: JLPT N5, then N4. Explanations are written for Gengo (never copied from a textbook).
// Examples are kana only, tokens separated by spaces; a fill point's answer sits in [brackets].
// match(tokens) tags Tatoeba sentences: tokens are {h: headword, s: surface, f: JMdict pos ('' in our own examples)}.

import { conjugate } from './conjugate.js';

const S = (ts, s) => ts.some(t => t.s === s && (t.f === '' || t.f === 'prt'));  // a particle, by surface
const J = ts => ts.map(t => t.s).join('');                                         // the sentence as one string
const last = ts => ts.filter(t => !/^[。、？！]$/.test(t.s)).at(-1)?.s;
const VERB = ['v1', 'v5', 'vk', 'vs'];
// A て form at ts[i]: a whole word ending in て/で (our examples), or a て/で token right after a verb or adjective
// (Tatoeba splits 起き|て), so the particle で (ここで、テレビで見た) never counts.
const TE = (ts, i) => /[てで]$/.test(ts[i].s) && !/^(ので|なので|まで|それで|そこで)$/.test(ts[i].s) && (ts[i].s.length > 1 ? ts[i].f === '' || /^v/.test(ts[i].f) : /^(v|adj)/.test(ts[i - 1]?.f ?? ''));
const end = ts => ts.filter(t => !/^[。、？！]$/.test(t.s));                        // the sentence without punctuation
// A verb in form f: a sentence word whose dictionary form conjugates to what follows it (Tatoeba), or, in our own
// examples (no part of speech), a token matching re.
const cj = (f, re) => ts => ts.some((t, i) => {
  if (t.f === '') return re.test(t.s);
  if (!/^v/.test(t.f)) return false;
  const c = conjugate(t.h, t.f, f), rest = ts.slice(i).map(x => x.s).join('');
  return !!c && rest.startsWith(/る$/.test(c) ? c.slice(0, -1) : c);
});

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

  // ---- N5, continued
  { id: 'g-kore', title: 'これ・それ・あれ・どれ', en: 'this, that, that over there, which', jlpt: 5, words: 120, acts: ['build'],
    explain: 'これ is "this" (near me), それ is "that" (near you), あれ is "that over there" (far from both of us), and どれ asks "which one?". They stand alone in place of a noun: これは ほんです, "this is a book".',
    ex: [{ jp: 'これ は わたし の かさ です 。', en: 'This is my umbrella.' }, { jp: 'あれ は なん です か 。', en: 'What is that over there?' }, { jp: 'どれ が いい です か 。', en: 'Which one is good?' }],
    match: ts => ts.some(t => /^(これ|それ|あれ|どれ)$/.test(t.s)) },

  { id: 'g-kono', title: 'この・その・あの・どの', en: 'this ~, that ~, which ~', jlpt: 5, words: 130, acts: ['build'],
    explain: 'この, その, あの and どの go right before a noun: このほん "this book", あのひと "that person over there", どのかばん "which bag?". They can\'t stand alone; これ, それ, あれ and どれ do that.',
    ex: [{ jp: 'この ほん は たかい です 。', en: 'This book is expensive.' }, { jp: 'あの ひと は だれ です か 。', en: 'Who is that person over there?' }, { jp: 'どの かばん です か 。', en: 'Which bag is it?' }],
    match: ts => ts.some(t => /^(この|その|あの|どの)$/.test(t.s)) },

  { id: 'g-koko', title: 'ここ・そこ・あそこ・どこ', en: 'here, there, over there, where', jlpt: 5, words: 140, acts: ['build'],
    explain: 'Places work the same way: ここ "here", そこ "there (near you)", あそこ "over there", and どこ "where?". トイレは どこですか is "Where is the toilet?".',
    ex: [{ jp: 'トイレ は どこ です か 。', en: 'Where is the toilet?' }, { jp: 'えき は あそこ です 。', en: 'The station is over there.' }, { jp: 'ここ で まって ください 。', en: 'Please wait here.' }],
    match: ts => ts.some(t => /^(ここ|そこ|あそこ|どこ)$/.test(t.s)) },

  { id: 'g-question', title: 'なに・だれ・いつ・いくら', en: 'Question words', jlpt: 5, words: 150, acts: ['build'],
    explain: 'A question word sits where the answer would go, and the sentence ends in か: なんですか "what is it?", だれですか "who is it?", いつですか "when is it?", いくらですか "how much is it?". なに becomes なん before です and の.',
    ex: [{ jp: 'これ は なん です か 。', en: 'What is this?' }, { jp: 'たんじょうび は いつ です か 。', en: 'When is your birthday?' }, { jp: 'この かさ は いくら です か 。', en: 'How much is this umbrella?' }],
    match: ts => ts.some(t => /^(なに|なん|何|だれ|誰|いつ|いくら)$/.test(t.s)) && last(ts) === 'か' },

  { id: 'g-to', title: 'XとY', en: 'and, with', jlpt: 5, words: 160, acts: ['fill', 'build'],
    choices: ['と', 'を', 'で', 'へ'], blank: 'と',
    explain: 'と joins nouns: パンと たまご, "bread and eggs". After a person it means "with": ともだちと いきます, "I go with a friend". It joins nouns only, never two sentences.',
    ex: [{ jp: 'パン [と] たまご を かいました 。', en: 'I bought bread and eggs.' }, { jp: 'ともだち [と] えいが を みます 。', en: 'I watch a film with a friend.' }],
    match: ts => S(ts, 'と') },

  { id: 'g-ya', title: 'XやY', en: 'and so on', jlpt: 5, words: 170, acts: ['fill', 'build'],
    choices: ['や', 'を', 'で', 'へ'], blank: 'や',
    explain: 'や lists a few examples from a longer list: りんごや バナナ, "apples, bananas and so on". と lists everything; や hints there is more. など at the end adds "etc.": りんごや バナナなど.',
    ex: [{ jp: 'りんご [や] バナナ を かいました 。', en: 'I bought apples, bananas and such.' }, { jp: 'つくえ の うえ に ほん [や] ノート が あります 。', en: 'There are books, notebooks and so on on the desk.' }],
    match: ts => S(ts, 'や') },

  { id: 'g-kara-made', title: 'から・まで', en: 'from, until', jlpt: 5, words: 180, acts: ['fill', 'build'],
    choices: ['から', 'を', 'が', 'へ'], blank: 'から',
    explain: 'から marks where or when something starts, and まで where or when it ends: くじから ごじまで "from nine until five", うちから えきまで "from home to the station".',
    ex: [{ jp: 'くじ [から] ごじ まで はたらきます 。', en: 'I work from nine to five.' }, { jp: 'うち [から] えき まで あるきます 。', en: 'I walk from home to the station.' }],
    match: ts => S(ts, 'から') || S(ts, 'まで') },

  { id: 'g-ni-iku', title: '〜にいきます', en: 'go to do', jlpt: 5, words: 190, acts: ['build'],
    explain: 'Take a verb\'s ます form, drop ます, and add に plus a verb of going: たべに いきます "go to eat", みに きました "came to see". It says why you go. Activity nouns work too: かいものに いきます "go shopping".',
    ex: [{ jp: 'すし を たべ に いきます 。', en: 'I am going to eat sushi.' }, { jp: 'デパート へ かいもの に いきました 。', en: 'I went shopping at the department store.' }],
    match: ts => ts.some((t, i) => t.s === 'に' && /^(行|い[きくけっこ]|来|き[ます]|く|帰[りるっれら]|かえ)/.test(ts[i + 1]?.s ?? '') && !!ts[i - 1]
      && (ts[i - 1].f === '' ? /^(たべ|かいもの|み|のみ|あそび|かい)$/.test(ts[i - 1].s) : /^v/.test(ts[i - 1].f) && ts[i - 1].s !== ts[i - 1].h)) },

  { id: 'g-na-adj', title: 'な-adjectives', en: 'しずかな まち', jlpt: 5, words: 200, acts: ['fill', 'build'],
    choices: ['な', 'の', 'に', 'を'],  // no blank: Tatoeba keeps 静かな as one token, and a bare な is often the "don't" な
    explain: 'Some adjectives take な before a noun: しずかな まち "a quiet town", きれいな へや "a pretty room". At the end of a sentence they take です instead: まちは しずかです. すき and きらい are な-adjectives too: すきな たべもの "favourite food".',
    ex: [{ jp: 'しずか [な] まち です 。', en: 'It is a quiet town.' }, { jp: 'きれい [な] へや です ね 。', en: 'What a pretty room.' }],
    match: ts => ts.some((t, i) => (t.s === 'な' && i > 0 && ts[i + 1] && !/^[。、？！]$/.test(ts[i + 1].s) && (ts[i - 1].f === '' ? /^(しずか|きれい|すき)$/.test(ts[i - 1].s) : /adj-na/.test(ts[i - 1].f)))
      || (/adj-na/.test(t.f) && /な$/.test(t.s) && /^n/.test(ts[i + 1]?.f ?? ''))) },

  { id: 'g-suki', title: '〜がすき・じょうず・わかる', en: 'が for likes and skills', jlpt: 5, words: 210, acts: ['fill', 'build'],
    choices: ['が', 'で', 'に', 'へ'], blank: 'が',
    explain: 'Liking, disliking, being good or bad at something, and understanding all take が, not を: ねこが すきです "I like cats", にほんごが わかります "I understand Japanese", りょうりが じょうずです "is good at cooking".',
    ex: [{ jp: 'わたし は ねこ [が] すき です 。', en: 'I like cats.' }, { jp: 'にほんご [が] すこし わかります 。', en: 'I understand a little Japanese.' }, { jp: 'あに は りょうり [が] じょうず です 。', en: 'My older brother is good at cooking.' }],
    match: ts => ts.some((t, i) => t.s === 'が' && ts.slice(i + 1).some(u => /^(好き|すき|嫌い|きらい|上手|じょうず|下手|へた|分か|わか)/.test(u.s))) },

  { id: 'g-hoshii', title: '〜がほしいです', en: 'I want (a thing)', jlpt: 5, words: 220, acts: ['fill', 'build'],
    choices: ['が', 'で', 'に', 'へ'], blank: 'が',
    explain: 'ほしい is an い-adjective meaning "wanted". The thing you want takes が: あたらしい くつが ほしいです "I want new shoes". To want to DO something, use 〜たい instead.',
    ex: [{ jp: 'あたらしい くるま [が] ほしい です 。', en: 'I want a new car.' }, { jp: 'なに [が] ほしい です か 。', en: 'What do you want?' }],
    match: ts => ts.some(t => /^(欲し|ほし)/.test(t.s)) },

  { id: 'g-dake', title: 'だけ', en: 'only, just', jlpt: 5, words: 230, acts: ['fill', 'build'],
    choices: ['だけ', 'を', 'で', 'へ'], blank: 'だけ',
    explain: 'だけ after a word means "only" or "just": ひとりだけ "only one person", すこしだけ "just a little". It takes the place of が and を.',
    ex: [{ jp: 'みず [だけ] のみました 。', en: 'I only drank water.' }, { jp: 'にほんご は すこし [だけ] わかります 。', en: 'I understand only a little Japanese.' }],
    match: ts => S(ts, 'だけ') },

  { id: 'g-yori', title: 'AはBより〜', en: 'Comparing', jlpt: 5, words: 240, acts: ['fill', 'build'],
    choices: ['より', 'から', 'まで', 'と'], blank: 'より',
    explain: 'To compare, put より after the thing you compare against: でんしゃは バスより はやいです "the train is faster than the bus". To ask which, use どちらが: どちらが すきですか. Answer with のほうが: いぬの ほうが すきです "I prefer dogs".',
    ex: [{ jp: 'でんしゃ は バス [より] はやい です 。', en: 'Trains are faster than buses.' }, { jp: 'きょう は きのう [より] さむい です 。', en: 'Today is colder than yesterday.' }],
    match: ts => S(ts, 'より') || /(の|な)(ほう|方)が/.test(J(ts)) },

  { id: 'g-ichiban', title: 'いちばん', en: 'the most', jlpt: 5, words: 250, acts: ['build'],
    explain: 'いちばん before an adjective makes "the most": いちばん たかい やま "the highest mountain", いちばん すきな たべもの "my favourite food". For "of all…" use 〜のなかで: くだものの なかで りんごが いちばん すきです.',
    ex: [{ jp: 'くだもの の なか で りんご が いちばん すき です 。', en: 'Of all fruit I like apples best.' }, { jp: 'これ が いちばん やすい です 。', en: 'This is the cheapest.' }],
    match: ts => ts.some(t => /^(一番|いちばん)$/.test(t.s)) },

  { id: 'g-dict', title: 'Dictionary form', en: 'Plain verbs', jlpt: 5, words: 260, acts: ['form', 'build'],
    forms: ['dict', 'masu', 'te', 'ta'], pos: VERB,
    explain: 'Every verb has a plain form, the one in the dictionary: たべる, のむ, いく. Friends and family use it instead of ます, and many patterns build on it. る-verbs swap る for ます (たべる → たべます); u-verbs move their last sound to the i-row (のむ → のみます). する → します and くる → きます are irregular.',
    ex: [{ jp: 'まいにち ほん を よむ 。', en: 'I read books every day. (casual)' }, { jp: 'あした ともだち が くる 。', en: 'A friend is coming tomorrow. (casual)' }],
    match: ts => { const v = end(ts).at(-1); return !!v && (v.f === '' ? /^(よむ|くる|いく|たべる|のむ)$/.test(v.s) : /^v/.test(v.f) && v.s === v.h) && !/です|ます/.test(J(ts)); } },

  { id: 'g-nai', title: 'Plain negative 〜ない', en: "Casual don't", jlpt: 5, words: 270, acts: ['form', 'build'],
    forms: ['nai', 'masen', 'dict', 'ta'], pos: VERB,
    explain: 'The casual "don\'t" is the ない form. る-verbs swap る for ない (たべる → たべない); u-verbs move their last sound to the a-row and add ない (のむ → のまない; う becomes わ: かう → かわない). する → しない, くる → こない, and ある → ない.',
    ex: [{ jp: 'きょう は いかない 。', en: "I'm not going today. (casual)" }, { jp: 'にく は たべない 。', en: "I don't eat meat. (casual)" }],
    match: cj('nai', /^(いかない|たべない)$/) },

  { id: 'g-ta', title: 'Plain past 〜た', en: 'Casual past', jlpt: 5, words: 280, acts: ['form', 'build'],
    forms: ['ta', 'mashita', 'te', 'nai'], pos: VERB,
    explain: 'The casual past is made exactly like the て form, with た for て (and だ for で): たべて → たべた, のんで → のんだ, いって → いった.',
    ex: [{ jp: 'きのう えいが を みた 。', en: 'I saw a film yesterday. (casual)' }, { jp: 'もう ひるごはん を たべた ？', en: 'Have you had lunch yet? (casual)' }],
    match: ts => cj('ta', /^(みた|たべた)$/)(ts) && !/ました/.test(J(ts)) },

  { id: 'g-nakatta', title: 'Plain past negative 〜なかった', en: "Casual didn't", jlpt: 5, words: 290, acts: ['form', 'build'],
    forms: ['nakatta', 'nai', 'ta', 'masendeshita'], pos: VERB,
    explain: 'For "didn\'t" in casual speech, take the ない form and change ない to なかった: たべない → たべなかった, いかない → いかなかった.',
    ex: [{ jp: 'きのう は どこ も いかなかった 。', en: "I didn't go anywhere yesterday. (casual)" }, { jp: 'あさごはん を たべなかった 。', en: "I didn't eat breakfast. (casual)" }],
    match: cj('nakatta', /^(いかなかった|たべなかった)$/) },

  { id: 'g-casual', title: 'Casual speech', en: 'Talking with friends', jlpt: 5, words: 300, acts: ['build'],
    explain: 'With friends and family, Japanese drops です and ます. Verbs and adjectives use their plain forms (いく, いかない, いった, たかい), nouns and な-adjectives end in だ or nothing at all, and questions usually drop か and just rise in tone: あした ひま？ Use polite speech with strangers, staff and anyone older.',
    ex: [{ jp: 'あした ひま ？', en: 'Are you free tomorrow?' }, { jp: 'うん 、 ひま だ よ 。', en: "Yeah, I'm free." }, { jp: 'この ケーキ 、 おいしい ね 。', en: 'This cake is good, isn\'t it?' }],
    match: ts => end(ts).length >= 2 && !/(です|ます|でし|まし|ください)/.test(J(ts)) && /[よねだ？]|^(うん|ううん)/.test(J(ts)) },

  { id: 'g-deshita', title: 'でした・じゃなかったです', en: 'was, was not', jlpt: 5, words: 310, acts: ['fill', 'build'],
    choices: ['でした', 'です', 'じゃないです', 'ました'],  // no blank: Tatoeba splits でし/た, so fill uses these examples only
    explain: 'For the past of a noun or な-adjective, です becomes でした "was", and じゃないです becomes じゃなかったです "was not": きのうは あめでした "it was rainy yesterday". In casual speech: あめだった, あめじゃなかった.',
    ex: [{ jp: 'きのう は あめ [でした] 。', en: 'It was rainy yesterday.' }, { jp: 'その まち は しずか [でした] 。', en: 'That town was quiet.' }],
    match: ts => /でした|だった|じゃなかった|ではなかった/.test(J(ts)) },

  { id: 'g-te-iru', title: '〜ています', en: 'is doing; is in a state', jlpt: 5, words: 320, acts: ['form', 'build'],
    forms: ['teimasu', 'te', 'masu', 'mashita'], pos: VERB,
    explain: 'The て form plus います says something is going on now: いま たべています "I am eating". With some verbs it describes a lasting state: けっこんしています "is married", しっています "know", すんでいます "live (somewhere)". Casually: たべている, often shortened to たべてる.',
    ex: [{ jp: 'いま あめ が ふって います 。', en: 'It is raining now.' }, { jp: 'あね は とうきょう に すんで います 。', en: 'My older sister lives in Tokyo.' }],
    match: ts => /[てで]い(る|ます|まし|た|ない|て)/.test(J(ts)) },

  { id: 'g-te-mo-ii', title: '〜てもいいです', en: 'may (permission)', jlpt: 5, words: 330, acts: ['build'],
    explain: 'The て form plus もいいです gives permission: たべても いいです "you may eat". As a question it asks for it: しゃしんを とっても いいですか "may I take a photo?". The answer is often はい、どうぞ.',
    ex: [{ jp: 'ここ で しゃしん を とって も いい です か 。', en: 'May I take photos here?' }, { jp: 'まど を あけて も いい です よ 。', en: 'You may open the window.' }],
    match: ts => /[てで]も(いい|良い|かまわ|構わ)/.test(J(ts)) },

  { id: 'g-te-wa-ikenai', title: '〜てはいけません', en: 'must not', jlpt: 5, words: 340, acts: ['build'],
    explain: 'The て form plus はいけません forbids something: ここで たばこを すっては いけません "you must not smoke here". は is said "wa" here. Casually, ては shortens to ちゃ: たべちゃ だめ "don\'t eat that".',
    ex: [{ jp: 'ここ で たばこ を すって は いけません 。', en: 'You must not smoke here.' }, { jp: 'じゅぎょう で ねて は いけません 。', en: 'You must not sleep in class.' }],
    match: ts => /[てで]は(いけ|だめ|駄目|なら)|ちゃ(いけ|だめ)|じゃ(いけ|だめ)/.test(J(ts)) },

  { id: 'g-te-kara', title: '〜てから', en: 'after doing', jlpt: 5, words: 350, acts: ['build'],
    explain: 'The て form plus から means "after doing": ごはんを たべてから、はを みがきます "after eating, I brush my teeth". The first action comes first in the sentence too.',
    ex: [{ jp: 'しゅくだい を して から あそびます 。', en: 'I will play after doing my homework.' }, { jp: 'てがみ を かいて から ねました 。', en: 'I went to bed after writing a letter.' }],
    match: ts => ts.some((t, i) => TE(ts, i) && ts[i + 1]?.s === 'から') },

  { id: 'g-te-link', title: '〜て、〜', en: 'and then (linking)', jlpt: 5, words: 360, acts: ['build'],
    explain: 'The て form links actions in order: あさ おきて、シャワーを あびて、がっこうへ いきます "I get up, shower and go to school". Only the last verb shows the tense and politeness. い-adjectives link with くて: やすくて おいしい "cheap and tasty".',
    ex: [{ jp: 'あさ おきて 、 コーヒー を のみます 。', en: 'In the morning I get up and drink coffee.' }, { jp: 'この みせ は やすくて おいしい です 。', en: 'This shop is cheap and good.' }],
    match: ts => ts.some((t, i) => (TE(ts, i) && ts[i + 1]?.s === '、') || /くて$/.test(t.s) || (t.s === 'て' && /く$/.test(ts[i - 1]?.s ?? ''))) },

  { id: 'g-mashou', title: '〜ましょう', en: "let's; shall I?", jlpt: 5, words: 370, acts: ['form', 'build'],
    forms: ['mashou', 'masu', 'masen', 'mashita'], pos: VERB,
    explain: 'Change ます to ましょう for "let\'s": いきましょう "let\'s go". Add か to offer or suggest: てつだいましょうか "shall I help?". ませんか is a softer invitation: いっしょに たべませんか "won\'t you eat with me?".',
    ex: [{ jp: 'いっしょ に かえりましょう 。', en: "Let's go home together." }, { jp: 'まど を あけましょう か 。', en: 'Shall I open the window?' }, { jp: 'こんど いっしょ に えいが を みません か 。', en: "Won't you see a film with me sometime?" }],
    match: ts => /ましょう|ませんか/.test(J(ts)) },

  { id: 'g-mae-ni', title: '〜まえに', en: 'before', jlpt: 5, words: 380, acts: ['build'],
    explain: 'The dictionary form plus まえに means "before doing": ねる まえに "before going to bed". After a noun use のまえに: しょくじの まえに "before the meal". The verb before まえ stays in the dictionary form, even when talking about the past.',
    ex: [{ jp: 'ねる まえ に ほん を よみます 。', en: 'I read before going to bed.' }, { jp: 'しょくじ の まえ に て を あらいます 。', en: 'I wash my hands before meals.' }],
    match: ts => ts.some((t, i) => /^(前|まえ)$/.test(t.s) && ts[i + 1]?.s === 'に' && i > 0
      && (ts[i - 1].f === '' ? /^(ねる|の)$/.test(ts[i - 1].s) && (ts[i - 1].s !== 'の' || /^(しょくじ|食事)$/.test(ts[i - 2]?.s ?? '')) : /^v/.test(ts[i - 1].f) && ts[i - 1].s === ts[i - 1].h)) },

  { id: 'g-ato-de', title: '〜たあとで', en: 'after', jlpt: 5, words: 390, acts: ['build'],
    explain: 'The た form plus あとで means "after doing": しごとが おわった あとで "after work finishes". After a noun use のあとで: じゅぎょうの あとで "after class".',
    ex: [{ jp: 'しごと が おわった あと で のみ に いきます 。', en: 'After work I go for a drink.' }, { jp: 'じゅぎょう の あと で としょかん へ いきました 。', en: 'After class I went to the library.' }],
    match: ts => ts.some((t, i) => /^(後|あと)$/.test(t.s) && /^(で|に)$/.test(ts[i + 1]?.s ?? '') && /^(た|だ|の)$|[ただ]$/.test(ts[i - 1]?.s ?? '')) },

  { id: 'g-kara-because', title: '〜から (because)', en: 'because, so', jlpt: 5, words: 400, acts: ['build'],
    explain: 'から after a whole sentence gives the reason: あついから、まどを あけます "it\'s hot, so I\'ll open the window". The reason comes first. To answer "why?" (どうして), end with からです.',
    ex: [{ jp: 'あつい です から 、 まど を あけて ください 。', en: "It's hot, so please open the window." }, { jp: 'あした テスト が ある から 、 べんきょう します 。', en: "I have a test tomorrow, so I'll study." }],
    match: ts => ts.some((t, i) => t.s === 'から' && i > 0 && /(だ|です|ます|た|い|る|う|く|ぬ|む|ぶ|ぐ|す|つ)$/.test(ts[i - 1].s) && (!ts[i + 1] || /^[。、]$/.test(ts[i + 1].s))) },

  { id: 'g-kedo', title: '〜が・〜けど', en: 'but', jlpt: 5, words: 410, acts: ['build'],
    explain: 'が after a full sentence means "but": たかいですが、おいしいです "it\'s expensive, but tasty". けど is the everyday, more casual version. Both also soften a request: すみませんが… "excuse me, but…".',
    ex: [{ jp: 'たかい です が 、 おいしい です 。', en: "It's expensive but delicious." }, { jp: 'いきたい けど 、 じかん が ない 。', en: "I want to go, but I don't have time." }],
    match: ts => ts.some(t => /^(けど|けれど|けれども)$/.test(t.s)) || /(です|ます|でした|ました)が、/.test(J(ts)) },

  { id: 'g-naru', title: '〜くなる・〜になる', en: 'become', jlpt: 5, words: 420, acts: ['build'],
    explain: 'なる means "become". い-adjectives change い to く: さむく なりました "it got cold". Nouns and な-adjectives take に: いしゃに なりたい "I want to become a doctor", しずかに なりました "it went quiet".',
    ex: [{ jp: 'さむく なりました ね 。', en: "It's got cold, hasn't it?" }, { jp: 'いしゃ に なりたい です 。', en: 'I want to become a doctor.' }],
    match: ts => ts.some((t, i) => /^(なる|なり|なっ|なら|なれ|成)/.test(t.s) && i > 0 && (/く$/.test(ts[i - 1].s) || ts[i - 1].s === 'に')) },

  { id: 'g-adverb', title: 'はやく・しずかに', en: 'Adverbs from adjectives', jlpt: 5, words: 430, acts: ['build'],
    explain: 'い-adjectives become adverbs with く: はやく おきます "get up early". な-adjectives take に: しずかに はなして ください "please speak quietly".',
    ex: [{ jp: 'あした は はやく おきます 。', en: "I'll get up early tomorrow." }, { jp: 'しずか に あるいて ください 。', en: 'Please walk quietly.' }],
    match: ts => ts.some((t, i) => t.f === '' ? /^(はやく|しずか)$/.test(t.s) && /^(おき|に)/.test(ts[i + 1]?.s ?? '')
      : (/^adj-i/.test(t.f) && /く$/.test(t.s) && /^v/.test(ts[i + 1]?.f ?? '')) || (/adj-na/.test(t.f) && ts[i + 1]?.s === 'に' && /^v/.test(ts[i + 2]?.f ?? ''))) },

  { id: 'g-mou-mada', title: 'もう・まだ', en: 'already, not yet', jlpt: 5, words: 440, acts: ['build'],
    explain: 'もう means "already" (or "anymore"), and まだ "still" or "not yet": もう たべました "I already ate", まだ たべて いません "I haven\'t eaten yet". Asked "have you…?", まだです means "not yet".',
    ex: [{ jp: 'もう しゅくだい を しました 。', en: 'I already did my homework.' }, { jp: 'まだ ひるごはん を たべて いません 。', en: "I haven't had lunch yet." }],
    match: ts => ts.some(t => /^(もう|まだ|未だ)$/.test(t.s)) },

  { id: 'g-ne-yo', title: '〜ね・〜よ', en: "isn't it? / you know", jlpt: 5, words: 450, acts: ['build'],
    explain: 'At the end of a sentence ね asks for agreement: いい てんきですね "lovely weather, isn\'t it?". よ tells the listener something they may not know: あぶないですよ "careful, it\'s dangerous". よね checks something you think is true.',
    ex: [{ jp: 'いい てんき です ね 。', en: "It's nice weather, isn't it?" }, { jp: 'その みせ は やすい です よ 。', en: 'That shop is cheap, you know.' }],
    match: ts => /^(ね|よ|よね)$/.test(last(ts) ?? '') },

  { id: 'g-toki', title: '〜とき', en: 'when', jlpt: 5, words: 460, acts: ['build'],
    explain: 'とき means "when" or "at the time": こどもの とき "when I was a child", ひまな とき "when I am free", ねる とき "when I go to bed". The verb or adjective before it is in plain form.',
    ex: [{ jp: 'こども の とき 、 よく うみ で およぎました 。', en: 'When I was a child I often swam in the sea.' }, { jp: 'ひま な とき 、 ほん を よみます 。', en: "When I'm free I read." }],
    match: ts => ts.some((t, i) => (t.s === 'とき' || (t.s === '時' && t.r === 'とき')) && !/[一二三四五六七八九十〇0-9０-９何毎]$/.test(ts[i - 1]?.s ?? '')) },

  { id: 'g-relative', title: 'Describing nouns with verbs', en: 'きのう かった ほん', jlpt: 5, words: 470, acts: ['build'],
    explain: 'A whole verb phrase can sit right before a noun to describe it, in plain form: きのう かった ほん "the book I bought yesterday", あそこに いる ひと "the person over there". There is no word for "that", "who" or "which".',
    ex: [{ jp: 'きのう かった ほん は おもしろい です 。', en: 'The book I bought yesterday is interesting.' }, { jp: 'あそこ に いる ひと は だれ です か 。', en: 'Who is the person over there?' }],
    match: ts => ts.some((t, i) => t.f === '' ? /^(かった|いる)$/.test(t.s) && /^(ほん|ひと)$/.test(ts[i + 1]?.s ?? '')
      : /^v/.test(t.f) && t.s === t.h && /^n/.test(ts[i + 1]?.f ?? '')) || ts.some((t, i) => /^(た|だ)$/.test(t.s) && t.f === '' && i > 0 && /^v/.test(ts[i - 1].f) && /^n/.test(ts[i + 1]?.f ?? '')) },

  // ---- N4
  { id: 'g-pot', title: 'Potential form', en: 'can do', jlpt: 4, words: 500, acts: ['form', 'build'],
    forms: ['pot', 'dict', 'masu', 'nai'], pos: VERB,
    explain: 'To say you can do something, use the potential form. る-verbs swap る for られる (たべる → たべられる; in speech often たべれる). u-verbs move to the e-row and add る (のむ → のめる, いく → いける). する → できる, くる → こられる. What you can do usually takes が: にほんごが はなせます.',
    ex: [{ jp: 'にほんご が すこし はなせます 。', en: 'I can speak a little Japanese.' }, { jp: 'さしみ が たべられます か 。', en: 'Can you eat raw fish?' }],
    match: ts => cj('pot', /^(はなせます|たべられます)$/)(ts) || ts.some(t => /^(でき|出来)/.test(t.s)) },

  { id: 'g-to-omou', title: '〜とおもいます・〜といいました', en: 'I think…, (they) said…', jlpt: 4, words: 520, acts: ['build'],
    explain: 'と quotes a thought or words: plain form + と おもいます "I think that…": あした あめが ふると おもいます "I think it will rain tomorrow". With nouns and な-adjectives add だ: いい ひとだと おもいます. と いいました reports what someone said.',
    ex: [{ jp: 'あした は あめ が ふる と おもいます 。', en: 'I think it will rain tomorrow.' }, { jp: 'たなか さん は こない と いいました 。', en: 'Tanaka-san said he is not coming.' }],
    match: ts => ts.some((t, i) => t.s === 'と' && /^(思|おも|言|い[いっうわえ])/.test(ts[i + 1]?.s ?? '')) },

  { id: 'g-koto-dekiru', title: '〜ことができます', en: 'can do (formal)', jlpt: 4, words: 540, acts: ['build'],
    explain: 'Dictionary form + ことが できます is another way to say "can": およぐ ことが できます "I can swim". It sounds a little more formal than the potential form and is common on signs and in rules.',
    ex: [{ jp: 'わたし は およぐ こと が できます 。', en: 'I can swim.' }, { jp: 'ここ で カード を つかう こと が できます 。', en: 'You can use a card here.' }],
    match: ts => /(こと|事)が(でき|出来)/.test(J(ts)) },

  { id: 'g-vol', title: 'Volitional 〜よう・〜おう', en: "let's (casual); I'll…", jlpt: 4, words: 560, acts: ['form', 'build'],
    forms: ['vol', 'mashou', 'dict', 'nai'], pos: VERB,
    explain: 'The casual "let\'s" is the volitional form. る-verbs swap る for よう (たべる → たべよう); u-verbs move to the o-row and add う (いく → いこう, のむ → のもう). する → しよう, くる → こよう. With と おもいます it means "I\'m thinking of doing": にほんへ いこうと おもいます.',
    ex: [{ jp: 'いっしょ に いこう 。', en: "Let's go together. (casual)" }, { jp: 'らいねん にほん へ いこう と おもいます 。', en: "I'm thinking of going to Japan next year." }],
    match: cj('vol', /^(いこう)$/) },

  { id: 'g-tsumori', title: '〜つもりです', en: 'intend to', jlpt: 4, words: 580, acts: ['build'],
    explain: 'Dictionary form + つもりです says what you intend to do: なつやすみに にほんへ いく つもりです "I plan to go to Japan in the summer holidays". For "don\'t intend to", use ない つもりです.',
    ex: [{ jp: 'なつ に にほん へ いく つもり です 。', en: 'I plan to go to Japan in the summer.' }, { jp: 'きょう は なに も しない つもり です 。', en: "I don't plan to do anything today." }],
    match: ts => ts.some(t => /^(つもり|積もり)$/.test(t.s)) },

  { id: 'g-te-miru', title: '〜てみます', en: 'try doing', jlpt: 4, words: 600, acts: ['build'],
    explain: 'The て form plus みる means "try doing and see": たべて みます "I\'ll try eating it". たべて みて ください is "please try it".',
    ex: [{ jp: 'この ケーキ を たべて みて ください 。', en: 'Please try this cake.' }, { jp: 'にほん の おんせん に いって みたい です 。', en: "I'd like to try going to a Japanese hot spring." }],
    match: ts => ts.some((t, i) => TE(ts, i) && /^(み|見)(?!え)/.test(ts[i + 1]?.s ?? '') && (ts[i + 1].f === '' || /^v/.test(ts[i + 1].f))) },

  { id: 'g-koto-ga-aru', title: '〜たことがあります', en: 'have done (before)', jlpt: 4, words: 620, acts: ['build'],
    explain: 'The た form plus ことが あります talks about experience: すしを たべた ことが あります "I have eaten sushi (before)". The negative, ことが ありません, means "have never".',
    ex: [{ jp: 'ふじさん に のぼった こと が あります 。', en: 'I have climbed Mount Fuji.' }, { jp: 'にほん へ いった こと が ありません 。', en: 'I have never been to Japan.' }],
    match: ts => /[ただ](こと|事)が(あ|有)/.test(J(ts)) },

  { id: 'g-tari', title: '〜たり〜たりします', en: 'things like … and …', jlpt: 4, words: 640, acts: ['build'],
    explain: 'たり on two or more た forms, then します, lists some of the things you do: やすみの ひは そうじを したり、かいものを したり します "on days off I do things like cleaning and shopping".',
    ex: [{ jp: 'にちようび は ほん を よんだり 、 えいが を みたり します 。', en: 'On Sundays I read and watch films and so on.' }, { jp: 'きのう は そうじ を したり 、 かいもの を したり しました 。', en: 'Yesterday I did some cleaning, some shopping and so on.' }],
    match: ts => ts.some(t => /^v/.test(t.f) ? t.s === (conjugate(t.h, t.f, 'ta') ?? '') + 'り' : /^(たり|だり)$/.test(t.s) || (t.f === '' && t.s.length > 2 && /[ただ]り$/.test(t.s))) },

  { id: 'g-nagara', title: '〜ながら', en: 'while', jlpt: 4, words: 660, acts: ['build'],
    explain: 'A verb\'s ます form without ます, plus ながら, means "while doing": おんがくを ききながら べんきょうします "I study while listening to music". The main action comes last.',
    ex: [{ jp: 'おんがく を きき ながら べんきょう します 。', en: 'I study while listening to music.' }, { jp: 'テレビ を みながら ごはん を たべます 。', en: 'I eat while watching TV.' }],
    match: ts => /ながら/.test(J(ts)) },

  { id: 'g-tara', title: '〜たら', en: 'if; when', jlpt: 4, words: 680, acts: ['form', 'build'],
    forms: ['tara', 'ta', 'te', 'ba'], pos: VERB,
    explain: 'The た form plus ら means "if" or "when (it happens)": あめが ふったら、いきません "if it rains, I won\'t go"; うちに かえったら、でんわします "when I get home, I\'ll call". It works for adjectives (たかかったら) and nouns (あめだったら) too.',
    ex: [{ jp: 'あめ が ふったら 、 いきません 。', en: "If it rains, I won't go." }, { jp: 'うち に かえったら 、 でんわ します 。', en: "I'll call when I get home." }],
    match: ts => cj('tara', /^(ふったら|かえったら)$/)(ts) || /(かったら|だったら)/.test(J(ts)) },

  { id: 'g-ba', title: '〜ば', en: 'if', jlpt: 4, words: 700, acts: ['form', 'build'],
    forms: ['ba', 'tara', 'nai', 'dict'], pos: VERB,
    explain: 'The ば form also means "if", often for advice or a condition: れんしゅうすれば、じょうずに なります "if you practise, you\'ll get good". る-verbs: たべる → たべれば; u-verbs move to the e-row and add ば (いく → いけば). い-adjectives: たかい → たかければ.',
    ex: [{ jp: 'まいにち れんしゅう すれば 、 じょうず に なります 。', en: "If you practise every day, you'll get good." }, { jp: 'はやく いけば 、 まにあいます 。', en: "If you go early, you'll make it in time." }],
    match: ts => cj('ba', /^(すれば|いけば)$/)(ts) || /ければ/.test(J(ts)) },

  { id: 'g-to-cond', title: '〜と (whenever)', en: 'when…, always', jlpt: 4, words: 720, acts: ['build'],
    explain: 'Dictionary form + と says one thing always follows another: このボタンを おすと、きっぷが でます "press this button and a ticket comes out"; はるに なると、さくらが さきます. Use it for natural results and directions, not for requests or plans.',
    ex: [{ jp: 'この ボタン を おす と 、 きっぷ が でます 。', en: 'Press this button and a ticket comes out.' }, { jp: 'まっすぐ いく と 、 えき が あります 。', en: "Go straight and you'll find the station." }],
    match: ts => ts.some((t, i) => t.s === 'と' && ts[i + 1]?.s === '、' && i > 0 && /[うくぐすつぬぶむる]$/.test(ts[i - 1].s)) },

  { id: 'g-nara', title: '〜なら', en: 'if it\'s…; as for', jlpt: 4, words: 740, acts: ['build'],
    explain: 'なら picks up something just mentioned and gives advice about it: にほんへ いくなら、きょうとが いいですよ "if you\'re going to Japan, Kyoto is good". After a noun: すしなら、あの みせが おいしいです "for sushi, that shop is good".',
    ex: [{ jp: 'すし なら 、 あの みせ が おいしい です 。', en: 'For sushi, that shop is good.' }, { jp: 'にほん へ いく なら 、 きょうと が いい です よ 。', en: "If you're going to Japan, Kyoto is good." }],
    match: ts => ts.some(t => t.s === 'なら' && (t.f === '' || /aux|cop|prt/.test(t.f))) },

  { id: 'g-node', title: '〜ので', en: 'because (softer)', jlpt: 4, words: 760, acts: ['build'],
    explain: 'ので gives a reason like から, but softer and more polite, good for explaining yourself: あたまが いたいので、かえります "I have a headache, so I\'ll go home". Nouns and な-adjectives take なので: あめなので.',
    ex: [{ jp: 'あたま が いたい ので 、 かえります 。', en: "I have a headache, so I'll go home." }, { jp: 'あめ な ので 、 タクシー で いきます 。', en: "It's raining, so I'll go by taxi." }],
    match: ts => ts.some(t => t.s === 'ので') || /ので(?!す)/.test(J(ts)) },

  { id: 'g-noni', title: '〜のに', en: 'even though', jlpt: 4, words: 780, acts: ['build'],
    explain: 'のに means "even though", usually with surprise or disappointment: たくさん べんきょうしたのに、テストは だめでした "even though I studied a lot, the test went badly".',
    ex: [{ jp: 'たくさん べんきょう した のに 、 テスト は だめ でした 。', en: 'Even though I studied a lot, the test went badly.' }, { jp: 'やくそく した のに 、 かれ は こなかった 。', en: "He didn't come, even though he promised." }],
    match: ts => ts.some(t => t.s === 'のに') },

  { id: 'g-n-desu', title: '〜んです', en: 'explaining', jlpt: 4, words: 800, acts: ['build'],
    explain: 'んです (or のです) after a plain form explains or asks for an explanation: どうしたんですか "what\'s wrong?"; あたまが いたいんです "(it\'s that) I have a headache". Nouns and な-adjectives take なんです. Casually: いたいんだ, どうしたの？',
    ex: [{ jp: 'どう した ん です か 。', en: "What's wrong?" }, { jp: 'あたま が いたい ん です 。', en: 'I have a headache, you see.' }],
    match: ts => ts.some((t, i) => t.s === 'ん' && /^です/.test(ts[i + 1]?.s ?? '')) || /[るいたうくすつむぶぐ]のです/.test(J(ts)) },

  { id: 'g-hou-ga-ii', title: '〜たほうがいいです', en: 'you should', jlpt: 4, words: 820, acts: ['build'],
    explain: 'The た form plus ほうが いいです gives advice: はやく ねた ほうが いいです "you\'d better go to bed early". For "better not", use the ない form: のまない ほうが いいです.',
    ex: [{ jp: 'はやく ねた ほう が いい です よ 。', en: "You'd better go to bed early." }, { jp: 'あまり のまない ほう が いい です 。', en: "You'd better not drink too much." }],
    match: ts => /(ほう|方)が(いい|良い)/.test(J(ts)) && /[ただい](ほう|方)/.test(J(ts)) },

  { id: 'g-nakereba', title: '〜なければなりません', en: 'must', jlpt: 4, words: 840, acts: ['build'],
    explain: 'The ない form with ない → なければ なりません means "must": あした はやく おきなければ なりません "I have to get up early tomorrow". In speech it\'s often なきゃ or なくちゃ: いかなきゃ "I have to go".',
    ex: [{ jp: 'あした は はやく おきなければ なりません 。', en: 'I have to get up early tomorrow.' }, { jp: 'もう かえらなきゃ 。', en: 'I have to go home now. (casual)' }],
    match: ts => /なければ(なら|なり|いけ)|なきゃ|なくちゃ|ないといけ/.test(J(ts)) },

  { id: 'g-nakutemo', title: '〜なくてもいいです', en: "don't have to", jlpt: 4, words: 860, acts: ['build'],
    explain: 'The ない form with ない → なくても いいです means "don\'t have to": あした こなくても いいです "you don\'t have to come tomorrow".',
    ex: [{ jp: 'あした は こなくて も いい です 。', en: "You don't have to come tomorrow." }, { jp: 'くつ を ぬがなくて も いい です 。', en: "You don't have to take off your shoes." }],
    match: ts => /なくても(いい|良い|かまわ)/.test(J(ts)) },

  { id: 'g-desho', title: 'でしょう・だろう', en: 'probably', jlpt: 4, words: 880, acts: ['build'],
    explain: 'でしょう after a plain form says "probably": あしたは はれるでしょう "it will probably be sunny tomorrow". だろう is the casual version. With a rising tone, でしょう？ asks for agreement: "right?".',
    ex: [{ jp: 'あした は はれる でしょう 。', en: 'It will probably be sunny tomorrow.' }, { jp: 'かれ は もう いえ に ついた だろう 。', en: "He's probably home by now." }],
    match: ts => /でしょう|だろう/.test(J(ts)) },

  { id: 'g-kamo', title: '〜かもしれません', en: 'might', jlpt: 4, words: 900, acts: ['build'],
    explain: 'かもしれません after a plain form means "might": あめが ふる かもしれません "it might rain". It is less sure than でしょう. Casually: かもしれない, or just かも.',
    ex: [{ jp: 'ごご は あめ が ふる かもしれません 。', en: 'It might rain in the afternoon.' }, { jp: 'かれ は こない かもしれない 。', en: "He might not come." }],
    match: ts => /かもしれ|かも知れ/.test(J(ts)) },

  { id: 'g-sou-look', title: '〜そうです (looks)', en: 'looks like', jlpt: 4, words: 920, acts: ['build'],
    explain: 'An adjective stem (drop the final い) plus そうです says how something looks: おいしそうです "it looks delicious", たかそうです "it looks expensive". いい becomes よさそう. With a verb\'s ます stem it says something is about to happen: あめが ふりそうです "it looks like rain".',
    ex: [{ jp: 'この ケーキ は おいしそう です ね 。', en: 'This cake looks delicious.' }, { jp: 'あめ が ふりそう です 。', en: 'It looks like it will rain.' }],
    match: ts => /[きしちにひみりぎじびけせてねべめれ]そう(です|だ|な|に)|さそう/.test(J(ts)) },

  { id: 'g-sou-hear', title: '〜そうです (I hear)', en: 'I hear that', jlpt: 4, words: 940, acts: ['build'],
    explain: 'A plain form plus そうです reports something you heard: あした あめが ふるそうです "I hear it will rain tomorrow". Mark the source with によると: てんきよほうに よると "according to the forecast".',
    ex: [{ jp: 'てんきよほう に よる と 、 あした は ゆき が ふる そう です 。', en: 'According to the forecast, it will snow tomorrow.' }, { jp: 'あの みせ は おいしい そう です 。', en: 'I hear that shop is good.' }],
    match: ts => /[うくぐすつぬぶむるいただ]そう(です|だ)/.test(J(ts)) },

  { id: 'g-you-mitai', title: '〜ようです・〜みたいです', en: 'seems', jlpt: 4, words: 960, acts: ['build'],
    explain: 'ようです and the more casual みたいです say what seems to be so, from what you notice: だれも いない ようです "nobody seems to be here"; かぜを ひいた みたいです "I seem to have caught a cold". Nouns take のようです or just みたいです.',
    ex: [{ jp: 'だれ も いない よう です 。', en: 'Nobody seems to be here.' }, { jp: 'かぜ を ひいた みたい です 。', en: 'I seem to have caught a cold.' }],
    match: ts => /(よう|みたい)(です|だ|な|に)/.test(J(ts)) && !/(おはよう|ように)/.test(J(ts)) },

  { id: 'g-ageru', title: 'あげる・くれる・もらう', en: 'give and receive', jlpt: 4, words: 980, acts: ['build'],
    explain: 'あげる is giving to someone else, くれる is someone giving to me (or my family), もらう is receiving: ともだちに はなを あげました "I gave a friend flowers"; ははが セーターを くれました "my mother gave me a sweater"; せんせいに ほんを もらいました "I got a book from my teacher".',
    ex: [{ jp: 'ともだち に はな を あげました 。', en: 'I gave flowers to a friend.' }, { jp: 'はは が セーター を くれました 。', en: 'My mother gave me a sweater.' }, { jp: 'せんせい に ほん を もらいました 。', en: 'I got a book from my teacher.' }],
    match: ts => ts.some((t, i) => /^(あげ|くれ|呉れ|もら|貰)/.test(t.s) && (t.f === '' || /^v/.test(t.f)) && !/[てで]$/.test(ts[i - 1]?.s ?? '')) },

  { id: 'g-te-ageru', title: '〜てあげる・てくれる・てもらう', en: 'do for someone', jlpt: 4, words: 1000, acts: ['build'],
    explain: 'The same three verbs after a て form are about favours: おしえて あげました "I taught (them, as a favour)"; ともだちが てつだって くれました "my friend helped me"; みちを おしえて もらいました "I had someone show me the way". 〜て くれませんか asks a favour politely.',
    ex: [{ jp: 'ともだち が ひっこし を てつだって くれました 。', en: 'My friend helped me move.' }, { jp: 'しゃしん を とって もらえません か 。', en: 'Could you take a photo for me?' }],
    match: ts => ts.some((t, i) => TE(ts, i) && /^(あげ|くれ|呉れ|もら|貰)/.test(ts[i + 1]?.s ?? '')) },

  { id: 'g-te-shimau', title: '〜てしまいました', en: 'ended up; did completely', jlpt: 4, words: 1020, acts: ['build'],
    explain: 'The て form plus しまう says something is done completely, or happened and you regret it: さいふを なくして しまいました "I (went and) lost my wallet". Casually it shrinks to ちゃった / じゃった: たべちゃった "I ate it all".',
    ex: [{ jp: 'さいふ を なくして しまいました 。', en: 'I lost my wallet.' }, { jp: 'ケーキ を ぜんぶ たべちゃった 。', en: 'I ate all the cake. (casual)' }],
    match: ts => /[てで]しま|ちゃっ|じゃっ|ちゃう|じゃう/.test(J(ts)) },

  { id: 'g-te-oku', title: '〜ておきます', en: 'do in advance', jlpt: 4, words: 1040, acts: ['build'],
    explain: 'The て form plus おく means doing something ahead of time or leaving it so: ホテルを よやくして おきます "I\'ll book the hotel in advance"; まどを あけて おいて ください "please leave the window open". Casually: しとく, あけとく.',
    ex: [{ jp: 'ホテル を よやく して おきます 。', en: "I'll book the hotel ahead of time." }, { jp: 'まど を あけて おいて ください 。', en: 'Please leave the window open.' }],
    match: ts => /[てで]お[きくいけか]|とく|とい[てた]/.test(J(ts)) && ts.some(t => /^(お[きくいけか]|置)/.test(t.s) || /とく$/.test(t.s)) },

  { id: 'g-sugiru', title: '〜すぎます', en: 'too much', jlpt: 4, words: 1060, acts: ['build'],
    explain: 'すぎる after a verb\'s ます stem or an adjective stem means "too much": たべすぎました "I ate too much"; この くつは たかすぎます "these shoes are too expensive". いい becomes よすぎる.',
    ex: [{ jp: 'きのう は のみすぎました 。', en: 'I drank too much yesterday.' }, { jp: 'この くつ は たかすぎます 。', en: 'These shoes are too expensive.' }],
    match: ts => ts.some((t, i) => /.(すぎ|過ぎ)/.test(t.s) || (/^(すぎ|過ぎ)/.test(t.s) && /^(v|adj)/.test(ts[i - 1]?.f ?? ''))) },

  { id: 'g-yasui', title: '〜やすい・〜にくい', en: 'easy to, hard to', jlpt: 4, words: 1080, acts: ['build'],
    explain: 'A verb\'s ます stem plus やすい means "easy to do", and plus にくい "hard to do": この ペンは かきやすいです "this pen is easy to write with"; この ほんは よみにくいです "this book is hard to read".',
    ex: [{ jp: 'この ペン は かきやすい です 。', en: 'This pen is easy to write with.' }, { jp: 'この じ は よみにくい です 。', en: 'These letters are hard to read.' }],
    match: ts => ts.some((t, i) => /^(やす|にく|難)/.test(t.s) && i > 0 && /^v/.test(ts[i - 1].f) && ts[i - 1].s !== ts[i - 1].h) || ts.some(t => t.f === '' && /(やすい|にくい)$/.test(t.s) && t.s.length > 3) },

  { id: 'g-tame', title: '〜ために', en: 'in order to; for', jlpt: 4, words: 1100, acts: ['build'],
    explain: 'Dictionary form + ために means "in order to": にほんで はたらく ために、にほんごを べんきょうしています. After a noun, のために means "for (the sake of)": かぞくの ために "for my family".',
    ex: [{ jp: 'にほん で はたらく ため に 、 にほんご を べんきょう して います 。', en: "I'm studying Japanese in order to work in Japan." }, { jp: 'かぞく の ため に はたらいて います 。', en: 'I work for my family.' }],
    match: ts => ts.some((t, i) => /^(ために|為に)$/.test(t.s) || (/^(ため|為)$/.test(t.s) && /^(に|の)$/.test(ts[i + 1]?.s ?? ''))) },

  { id: 'g-you-ni', title: '〜ように', en: 'so that', jlpt: 4, words: 1120, acts: ['build'],
    explain: 'A plain form (often the potential or ない form) plus ように means "so that": わすれない ように、メモします "I\'ll write it down so I don\'t forget". ように なる means "come to be able to": およげる ように なりました "I learned to swim".',
    ex: [{ jp: 'わすれない よう に 、 メモ します 。', en: "I'll make a note so I don't forget." }, { jp: 'およげる よう に なりました 。', en: 'I can swim now (I learned to).' }],
    match: ts => ts.some((t, i) => /^(ように|様に)$/.test(t.s) || (/^(よう|様)$/.test(t.s) && ts[i + 1]?.s === 'に')) },

  { id: 'g-pass', title: 'Passive form', en: 'is done to', jlpt: 4, words: 1140, acts: ['form', 'build'],
    forms: ['pass', 'caus', 'dict', 'masu'], pos: VERB,
    explain: 'The passive says something is done to the subject; the doer takes に: わたしは せんせいに しかられました "I was scolded by the teacher". る-verbs: たべる → たべられる; u-verbs move to the a-row and add れる (かう → かわれる). する → される, くる → こられる. It often means something unwelcome happened: あめに ふられました "I got rained on".',
    ex: [{ jp: 'せんせい に しかられました 。', en: 'I was scolded by the teacher.' }, { jp: 'でんしゃ で あし を ふまれました 。', en: 'Someone stepped on my foot on the train.' }],
    match: cj('pass', /^(しかられました|ふまれました)$/) },

  { id: 'g-caus', title: 'Causative form', en: 'make / let someone do', jlpt: 4, words: 1160, acts: ['form', 'build'],
    forms: ['caus', 'pass', 'dict', 'te'], pos: VERB,
    explain: 'The causative means making or letting someone do something: ははは わたしに やさいを たべさせました "my mother made me eat vegetables". る-verbs: たべる → たべさせる; u-verbs move to the a-row and add せる (いく → いかせる). する → させる, くる → こさせる. 〜させて ください asks "please let me…".',
    ex: [{ jp: 'はは は わたし に やさい を たべさせました 。', en: 'My mother made me eat vegetables.' }, { jp: 'わたし に はらわせて ください 。', en: 'Please let me pay.' }],
    match: cj('caus', /^(たべさせました|はらわせて)$/) },

  { id: 'g-keigo', title: 'Polite respect (keigo)', en: 'いらっしゃる, おります', jlpt: 4, words: 1180, acts: ['build'],
    explain: 'Shops, stations and hotels speak in keigo. Respectful verbs lift the other person: いらっしゃる (be, come, go), めしあがる (eat), おっしゃる (say), and お〜ください: おまちください "please wait". Humble verbs lower yourself: おります (am), まいります (go, come), いたします (do).',
    ex: [{ jp: 'しょうしょう おまち ください 。', en: 'Please wait a moment.' }, { jp: 'なに を めしあがります か 。', en: 'What would you like to eat?' }, { jp: 'たなか と もうします 。', en: 'My name is Tanaka.' }],
    match: ts => /いらっしゃ|めしあが|召し上が|おっしゃ|おります|まいり|参り|いたし|致し|もうし|申し|ご覧|お待ち|おまち/.test(J(ts)) },

  { id: 'g-shi', title: '〜し', en: 'and what\'s more', jlpt: 4, words: 1200, acts: ['build'],
    explain: 'し after a plain form lists reasons, one on top of another: この みせは やすいし、おいしいし、よく きます "this place is cheap, it\'s good, so I come often".',
    ex: [{ jp: 'この みせ は やすい し 、 おいしい し 、 よく きます 。', en: "This place is cheap and good, so I come often." }, { jp: 'きょう は あめ だ し 、 さむい し 、 うち に います 。', en: "It's raining and it's cold, so I'm staying in." }],
    match: ts => ts.some((t, i) => t.s === 'し' && ts[i + 1]?.s === '、' && (t.f === '' || /prt/.test(t.f))) },

  { id: 'g-hazu', title: '〜はずです', en: 'should be (expected)', jlpt: 4, words: 1220, acts: ['build'],
    explain: 'はずです says what you expect to be true, from what you know: でんしゃは もう つく はずです "the train should be arriving now". はずが ない means "can\'t possibly be".',
    ex: [{ jp: 'でんしゃ は もう つく はず です 。', en: 'The train should arrive any minute.' }, { jp: 'かれ は きょう くる はず です 。', en: 'He is supposed to come today.' }],
    match: ts => ts.some(t => /^(はず|筈)$/.test(t.s)) },

  { id: 'g-ni-suru', title: '〜にします', en: "I'll have; decide on", jlpt: 4, words: 1240, acts: ['build'],
    explain: 'Noun + に します means "decide on" or "I\'ll have", the way to order or choose: コーヒーに します "I\'ll have coffee". Dictionary form + ことに します means "decide to do": まいにち はしる ことに しました "I\'ve decided to run every day".',
    ex: [{ jp: 'わたし は コーヒー に します 。', en: "I'll have coffee." }, { jp: 'まいにち はしる こと に しました 。', en: "I've decided to run every day." }],
    match: ts => ts.some((t, i) => t.s === 'に' && /^(し|する|します)/.test(ts[i + 1]?.s ?? '') && (ts[i + 1].f === '' || /^vs/.test(ts[i + 1].f))) },
];
