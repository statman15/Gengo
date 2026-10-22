// The Tōkaidō: Hiroshige's Hōeidō series, Nihonbashi to Kyoto. Mastered kana move you along it.
const EARLY = 10, EARLY_STATIONS = 14, LATE = 25; // mastered items per station: first 14 stations, then the rest

// scene = what the print shows; focus = CSS object-position of the portrait crop; 50% 50% until tuned by eye.
const S = (name, jp, scene, focus = '50% 50%') => ({ name, jp, scene, focus });
export const STATIONS = [
  S('Nihonbashi', '日本橋', "A lord's procession sets out across the bridge at dawn", '48% 50%'), S('Shinagawa', '品川', "The procession files past the bay at sunrise", '35% 50%'), S('Kawasaki', '川崎', "Travellers cross the Rokugō River by ferry", '50% 50%'), S('Kanagawa', '神奈川', "Teahouse girls tug travellers in along the bay-side slope", '25% 50%'), S('Hodogaya', '保土ヶ谷', "Porters carry a palanquin over Shinmachi Bridge", '70% 50%'),
  S('Totsuka', '戸塚', "A rider dismounts at a teahouse where the roads fork"), S('Fujisawa', '藤沢', "Blind men cross the bridge below Yugyō-ji temple"), S('Hiratsuka', '平塚', "A runner hurries along a raised path through the rice fields"), S('Ōiso', '大磯', "Rain sweeps the seaside village"), S('Odawara', '小田原', "A lord's party fords the Sakawa River below the castle"),
  S('Hakone', '箱根', "A procession climbs the jagged pass above the lake", '60% 50%'), S('Mishima', '三島', "Travellers ride through the morning mist"), S('Numazu', '沼津', "Pilgrims walk the riverbank under a full moon"), S('Hara', '原', "Mount Fuji towers over the morning fields"), S('Yoshiwara', '吉原', "Children ride a horse down a pine-lined road, Fuji on the left"),
  S('Kanbara', '蒲原', "Snow falls on a sleeping village at night"), S('Yui', '由比', "Travellers peer over a cliff at Satta Pass toward Fuji"), S('Okitsu', '興津', "Wrestlers are carried across the Okitsu River"), S('Ejiri', '江尻', "Sailboats crowd the harbour off the Miho pine grove"), S('Fuchū', '府中', "Porters carry travellers across the Abe River"),
  S('Mariko', '鞠子', "Travellers stop at a teahouse famous for yam soup"), S('Okabe', '岡部', "Woodcutters climb the narrow Utsu Mountain pass"), S('Fujieda', '藤枝', "Porters and pack horses change over at the post station"), S('Shimada', '島田', "A long line of travellers waits on the Ōi riverbank"), S('Kanaya', '金谷', "Travellers are carried across the wide Ōi River"),
  S('Nissaka', '日坂', "Travellers gather round the Night-Weeping Stone on the mountain road"), S('Kakegawa', '掛川', "A kite flies over the Ōike bridge on the Akiba road"), S('Fukuroi', '袋井', "Porters rest at an outdoor tea stall"), S('Mitsuke', '見付', "Boats ferry travellers across the Tenryū River"), S('Hamamatsu', '浜松', "Travellers warm themselves at a fire on a winter's day"),
  S('Maisaka', '舞阪', "Fishing boats sail past Imagiri Point under Fuji"), S('Arai', '新居', "A lord's boat crosses the bay to the checkpoint"), S('Shirasuka', '白須賀', "A procession walks Shiomi Slope above the sea"), S('Futagawa', '二川', "Travellers rest at a sweet shop on the open moor"), S('Yoshida', '吉田', "Workers repair the castle above Toyokawa Bridge"),
  S('Goyu', '御油', "Inn women drag travellers in off the street at dusk"), S('Akasaka', '赤坂', "Guests relax at an inn while maids get ready"), S('Fujikawa', '藤川', "A lord's procession arrives at the town boundary"), S('Okazaki', '岡崎', "A procession crosses the long Yahagi Bridge"), S('Chiryū', '池鯉鮒', "Horses graze at the early-summer horse fair"),
  S('Narumi', '鳴海', "Shops sell the famous Arimatsu tie-dyed cloth"), S('Miya', '宮', "Runners race horses at the Atsuta shrine festival"), S('Kuwana', '桑名', "Boats sail in from the seven-league ferry"), S('Yokkaichi', '四日市', "A traveller chases his hat in a gale on the Mie River"), S('Ishiyakushi', '石薬師', "A temple village sits among autumn fields"),
  S('Shōno', '庄野', "Travellers run through a sudden driving rain"), S('Kameyama', '亀山', "A procession climbs to the castle on a clear morning after snow"), S('Seki', '関', "A lord's party sets off from the inn before dawn"), S('Sakanoshita', '坂下', "Travellers admire the steep Fudesute Mountain"), S('Tsuchiyama', '土山', "A procession crosses a bridge in the spring rain"),
  S('Minakuchi', '水口', "Women peel and dry gourd strips for the local delicacy"), S('Ishibe', '石部', "Travellers drink and dance at a country teahouse"), S('Kusatsu', '草津', "Porters hurry past a teahouse known for rice cakes"), S('Ōtsu', '大津', "Ox carts haul rice past the Hashirii well teahouse"), S('Kyōto', '京都', "Travellers cross the Sanjō Bridge into the capital"),
];

// The station names in kana, in order, for the station sheet on the Journey.
export const READINGS = ['にほんばし', 'しながわ', 'かわさき', 'かながわ', 'ほどがや', 'とつか', 'ふじさわ', 'ひらつか', 'おおいそ', 'おだわら',
  'はこね', 'みしま', 'ぬまづ', 'はら', 'よしわら', 'かんばら', 'ゆい', 'おきつ', 'えじり', 'ふちゅう', 'まりこ', 'おかべ', 'ふじえだ', 'しまだ', 'かなや',
  'にっさか', 'かけがわ', 'ふくろい', 'みつけ', 'はままつ', 'まいさか', 'あらい', 'しらすか', 'ふたがわ', 'よしだ', 'ごゆ', 'あかさか', 'ふじかわ', 'おかざき', 'ちりゅう',
  'なるみ', 'みや', 'くわな', 'よっかいち', 'いしやくし', 'しょうの', 'かめやま', 'せき', 'さかのした', 'つちやま', 'みなくち', 'いしべ', 'くさつ', 'おおつ', 'きょうと'];

// Mastered items needed to reach station i.
export const stationCost = i => i <= EARLY_STATIONS ? i * EARLY : EARLY_STATIONS * EARLY + (i - EARLY_STATIONS) * LATE;

// station = furthest reached; progress 0-1 toward the next (1 at the last).
export function journey(mastered) {
  const last = STATIONS.length - 1;
  let station = 0;
  while (station < last && mastered >= stationCost(station + 1)) station++;
  if (station === last) return { station, progress: 1 };
  const from = stationCost(station);
  return { station, progress: (mastered - from) / (stationCost(station + 1) - from) };
}

export const printSrc = i => `prints/${String(i).padStart(2, '0')}.jpg`;
