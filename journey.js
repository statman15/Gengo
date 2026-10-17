// The Tōkaidō: Hiroshige's Hōeidō series, Nihonbashi to Kyoto. Mastered kana move you along it.
const EARLY = 10, EARLY_STATIONS = 14, LATE = 25; // mastered items per station: first 14 stations, then the rest

// focus = CSS object-position of the portrait crop; 50% 50% until tuned by eye.
const S = (name, jp, focus = '50% 50%') => ({ name, jp, focus });
export const STATIONS = [
  S('Nihonbashi', '日本橋', '48% 50%'), S('Shinagawa', '品川', '35% 50%'), S('Kawasaki', '川崎', '50% 50%'), S('Kanagawa', '神奈川', '25% 50%'), S('Hodogaya', '保土ヶ谷', '70% 50%'),
  S('Totsuka', '戸塚'), S('Fujisawa', '藤沢'), S('Hiratsuka', '平塚'), S('Ōiso', '大磯'), S('Odawara', '小田原'),
  S('Hakone', '箱根', '60% 50%'), S('Mishima', '三島'), S('Numazu', '沼津'), S('Hara', '原'), S('Yoshiwara', '吉原'),
  S('Kanbara', '蒲原'), S('Yui', '由比'), S('Okitsu', '興津'), S('Ejiri', '江尻'), S('Fuchū', '府中'),
  S('Mariko', '鞠子'), S('Okabe', '岡部'), S('Fujieda', '藤枝'), S('Shimada', '島田'), S('Kanaya', '金谷'),
  S('Nissaka', '日坂'), S('Kakegawa', '掛川'), S('Fukuroi', '袋井'), S('Mitsuke', '見付'), S('Hamamatsu', '浜松'),
  S('Maisaka', '舞阪'), S('Arai', '新居'), S('Shirasuka', '白須賀'), S('Futagawa', '二川'), S('Yoshida', '吉田'),
  S('Goyu', '御油'), S('Akasaka', '赤坂'), S('Fujikawa', '藤川'), S('Okazaki', '岡崎'), S('Chiryū', '池鯉鮒'),
  S('Narumi', '鳴海'), S('Miya', '宮'), S('Kuwana', '桑名'), S('Yokkaichi', '四日市'), S('Ishiyakushi', '石薬師'),
  S('Shōno', '庄野'), S('Kameyama', '亀山'), S('Seki', '関'), S('Sakanoshita', '坂下'), S('Tsuchiyama', '土山'),
  S('Minakuchi', '水口'), S('Ishibe', '石部'), S('Kusatsu', '草津'), S('Ōtsu', '大津'), S('Kyōto', '京都'),
];

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
