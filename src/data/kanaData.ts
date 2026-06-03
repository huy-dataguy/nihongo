import { KanaCharacter } from "../types";

export const hiraganaData: KanaCharacter[] = [
  // A I U E O
  { char: "あ", romaji: "a", type: "gojuon", category: "hiragana" },
  { char: "い", romaji: "i", type: "gojuon", category: "hiragana" },
  { char: "う", romaji: "u", type: "gojuon", category: "hiragana" },
  { char: "え", romaji: "e", type: "gojuon", category: "hiragana" },
  { char: "お", romaji: "o", type: "gojuon", category: "hiragana" },
  
  // KA KI KU KE KO
  { char: "か", romaji: "ka", type: "gojuon", category: "hiragana" },
  { char: "き", romaji: "ki", type: "gojuon", category: "hiragana" },
  { char: "く", romaji: "ku", type: "gojuon", category: "hiragana" },
  { char: "け", romaji: "ke", type: "gojuon", category: "hiragana" },
  { char: "こ", romaji: "ko", type: "gojuon", category: "hiragana" },

  // SA SHI SU SE SO
  { char: "さ", romaji: "sa", type: "gojuon", category: "hiragana" },
  { char: "し", romaji: "shi", type: "gojuon", category: "hiragana" },
  { char: "す", romaji: "su", type: "gojuon", category: "hiragana" },
  { char: "せ", romaji: "se", type: "gojuon", category: "hiragana" },
  { char: "そ", romaji: "so", type: "gojuon", category: "hiragana" },

  // TA CHI TSU TE TO
  { char: "た", romaji: "ta", type: "gojuon", category: "hiragana" },
  { char: "ち", romaji: "chi", type: "gojuon", category: "hiragana" },
  { char: "つ", romaji: "tsu", type: "gojuon", category: "hiragana" },
  { char: "て", romaji: "te", type: "gojuon", category: "hiragana" },
  { char: "と", romaji: "to", type: "gojuon", category: "hiragana" },

  // NA NI NU NE NO
  { char: "な", romaji: "na", type: "gojuon", category: "hiragana" },
  { char: "に", romaji: "ni", type: "gojuon", category: "hiragana" },
  { char: "ぬ", romaji: "nu", type: "gojuon", category: "hiragana" },
  { char: "ね", romaji: "ne", type: "gojuon", category: "hiragana" },
  { char: "の", romaji: "no", type: "gojuon", category: "hiragana" },

  // HA HI FU HE HO
  { char: "は", romaji: "ha", type: "gojuon", category: "hiragana" },
  { char: "ひ", romaji: "hi", type: "gojuon", category: "hiragana" },
  { char: "ふ", romaji: "fu", type: "gojuon", category: "hiragana" },
  { char: "へ", romaji: "he", type: "gojuon", category: "hiragana" },
  { char: "ほ", romaji: "ho", type: "gojuon", category: "hiragana" },

  // MA MI MU ME MO
  { char: "ま", romaji: "ma", type: "gojuon", category: "hiragana" },
  { char: "み", romaji: "mi", type: "gojuon", category: "hiragana" },
  { char: "む", romaji: "mu", type: "gojuon", category: "hiragana" },
  { char: "め", romaji: "me", type: "gojuon", category: "hiragana" },
  { char: "も", romaji: "mo", type: "gojuon", category: "hiragana" },

  // YA YU YO
  { char: "や", romaji: "ya", type: "gojuon", category: "hiragana" },
  { char: "ゆ", romaji: "yu", type: "gojuon", category: "hiragana" },
  { char: "よ", romaji: "yo", type: "gojuon", category: "hiragana" },

  // RA RI RU RE RO
  { char: "ら", romaji: "ra", type: "gojuon", category: "hiragana" },
  { char: "り", romaji: "ri", type: "gojuon", category: "hiragana" },
  { char: "る", romaji: "ru", type: "gojuon", category: "hiragana" },
  { char: "れ", romaji: "re", type: "gojuon", category: "hiragana" },
  { char: "ろ", romaji: "ro", type: "gojuon", category: "hiragana" },

  // WA WO N
  { char: "わ", romaji: "wa", type: "gojuon", category: "hiragana" },
  { char: "を", romaji: "wo", type: "gojuon", category: "hiragana" },
  { char: "ん", romaji: "n", type: "gojuon", category: "hiragana" },

  // Dakuon (GA GI GU GE GO, etc)
  { char: "が", romaji: "ga", type: "dakuon", category: "hiragana" },
  { char: "ぎ", romaji: "gi", type: "dakuon", category: "hiragana" },
  { char: "ぐ", romaji: "gu", type: "dakuon", category: "hiragana" },
  { char: "げ", romaji: "ge", type: "dakuon", category: "hiragana" },
  { char: "ご", romaji: "go", type: "dakuon", category: "hiragana" },

  { char: "ざ", romaji: "za", type: "dakuon", category: "hiragana" },
  { char: "じ", romaji: "ji", type: "dakuon", category: "hiragana" },
  { char: "ず", romaji: "zu", type: "dakuon", category: "hiragana" },
  { char: "ぜ", romaji: "ze", type: "dakuon", category: "hiragana" },
  { char: "ぞ", romaji: "zo", type: "dakuon", category: "hiragana" },

  { char: "だ", romaji: "da", type: "dakuon", category: "hiragana" },
  { char: "ぢ", romaji: "ji", type: "dakuon", category: "hiragana" },
  { char: "づ", romaji: "zu", type: "dakuon", category: "hiragana" },
  { char: "で", romaji: "de", type: "dakuon", category: "hiragana" },
  { char: "ど", romaji: "do", type: "dakuon", category: "hiragana" },

  { char: "ば", romaji: "ba", type: "dakuon", category: "hiragana" },
  { char: "び", romaji: "bi", type: "dakuon", category: "hiragana" },
  { char: "ぶ", romaji: "bu", type: "dakuon", category: "hiragana" },
  { char: "べ", romaji: "be", type: "dakuon", category: "hiragana" },
  { char: "ぼ", romaji: "bo", type: "dakuon", category: "hiragana" },

  // Handakuon
  { char: "ぱ", romaji: "pa", type: "handakuon", category: "hiragana" },
  { char: "ぴ", romaji: "pi", type: "handakuon", category: "hiragana" },
  { char: "ぷ", romaji: "pu", type: "handakuon", category: "hiragana" },
  { char: "ぺ", romaji: "pe", type: "handakuon", category: "hiragana" },
  { char: "ぽ", romaji: "po", type: "handakuon", category: "hiragana" },

  // Yoon (Contracted sounds)
  { char: "きゃ", romaji: "kya", type: "yoon", category: "hiragana" },
  { char: "きゅ", romaji: "kyu", type: "yoon", category: "hiragana" },
  { char: "きょ", romaji: "kyo", type: "yoon", category: "hiragana" },
  { char: "しゃ", romaji: "sha", type: "yoon", category: "hiragana" },
  { char: "しゅ", romaji: "shu", type: "yoon", category: "hiragana" },
  { char: "しょ", romaji: "sho", type: "yoon", category: "hiragana" },
  { char: "ちゃ", romaji: "cha", type: "yoon", category: "hiragana" },
  { char: "ちゅ", romaji: "chu", type: "yoon", category: "hiragana" },
  { char: "ちょ", romaji: "cho", type: "yoon", category: "hiragana" },
  { char: "にゃ", romaji: "nya", type: "yoon", category: "hiragana" },
  { char: "にゅ", romaji: "nyu", type: "yoon", category: "hiragana" },
  { char: "にょ", romaji: "nyo", type: "yoon", category: "hiragana" },
  { char: "ひゃ", romaji: "hya", type: "yoon", category: "hiragana" },
  { char: "ひゅ", romaji: "hyu", type: "yoon", category: "hiragana" },
  { char: "ひょ", romaji: "hyo", type: "yoon", category: "hiragana" },
  { char: "みゃ", romaji: "mya", type: "yoon", category: "hiragana" },
  { char: "みゅ", romaji: "myu", type: "yoon", category: "hiragana" },
  { char: "みょ", romaji: "myo", type: "yoon", category: "hiragana" },
  { char: "りゃ", romaji: "rya", type: "yoon", category: "hiragana" },
  { char: "りゅ", romaji: "ryu", type: "yoon", category: "hiragana" },
  { char: "りょ", romaji: "ryo", type: "yoon", category: "hiragana" },
  { char: "ぎゃ", romaji: "gya", type: "yoon", category: "hiragana" },
  { char: "ぎゅ", romaji: "gyu", type: "yoon", category: "hiragana" },
  { char: "ぎょ", romaji: "gyo", type: "yoon", category: "hiragana" },
  { char: "じゃ", romaji: "ja", type: "yoon", category: "hiragana" },
  { char: "じゅ", romaji: "ju", type: "yoon", category: "hiragana" },
  { char: "じょ", romaji: "jo", type: "yoon", category: "hiragana" },
  { char: "びゃ", romaji: "bya", type: "yoon", category: "hiragana" },
  { char: "びゅ", romaji: "byu", type: "yoon", category: "hiragana" },
  { char: "びょ", romaji: "byo", type: "yoon", category: "hiragana" },
  { char: "ぴゃ", romaji: "pya", type: "yoon", category: "hiragana" },
  { char: "ぴゅ", romaji: "pyu", type: "yoon", category: "hiragana" },
  { char: "ぴょ", romaji: "pyo", type: "yoon", category: "hiragana" }
];

export const katakanaData: KanaCharacter[] = [
  // A I U E O
  { char: "ア", romaji: "a", type: "gojuon", category: "katakana" },
  { char: "イ", romaji: "i", type: "gojuon", category: "katakana" },
  { char: "ウ", romaji: "u", type: "gojuon", category: "katakana" },
  { char: "エ", romaji: "e", type: "gojuon", category: "katakana" },
  { char: "オ", romaji: "o", type: "gojuon", category: "katakana" },

  // KA KI KU KE KO
  { char: "カ", romaji: "ka", type: "gojuon", category: "katakana" },
  { char: "キ", romaji: "ki", type: "gojuon", category: "katakana" },
  { char: "ク", romaji: "ku", type: "gojuon", category: "katakana" },
  { char: "ケ", romaji: "ke", type: "gojuon", category: "katakana" },
  { char: "コ", romaji: "ko", type: "gojuon", category: "katakana" },

  // SA SHI SU SE SO
  { char: "サ", romaji: "sa", type: "gojuon", category: "katakana" },
  { char: "シ", romaji: "shi", type: "gojuon", category: "katakana" },
  { char: "ス", romaji: "su", type: "gojuon", category: "katakana" },
  { char: "セ", romaji: "se", type: "gojuon", category: "katakana" },
  { char: "ソ", romaji: "so", type: "gojuon", category: "katakana" },

  // TA CHI TSU TE TO
  { char: "タ", romaji: "ta", type: "gojuon", category: "katakana" },
  { char: "チ", romaji: "chi", type: "gojuon", category: "katakana" },
  { char: "ツ", romaji: "tsu", type: "gojuon", category: "katakana" },
  { char: "テ", romaji: "te", type: "gojuon", category: "katakana" },
  { char: "ト", romaji: "to", type: "gojuon", category: "katakana" },

  // NA NI NU NE NO
  { char: "ナ", romaji: "na", type: "gojuon", category: "katakana" },
  { char: "ニ", romaji: "ni", type: "gojuon", category: "katakana" },
  { char: "ヌ", romaji: "nu", type: "gojuon", category: "katakana" },
  { char: "ネ", romaji: "ne", type: "gojuon", category: "katakana" },
  { char: "ノ", romaji: "no", type: "gojuon", category: "katakana" },

  // HA HI FU HE HO
  { char: "ハ", romaji: "ha", type: "gojuon", category: "katakana" },
  { char: "ヒ", romaji: "hi", type: "gojuon", category: "katakana" },
  { char: "フ", romaji: "fu", type: "gojuon", category: "katakana" },
  { char: "ヘ", romaji: "he", type: "gojuon", category: "katakana" },
  { char: "ホ", romaji: "ho", type: "gojuon", category: "katakana" },

  // MA MI MU ME MO
  { char: "マ", romaji: "ma", type: "gojuon", category: "katakana" },
  { char: "ミ", romaji: "mi", type: "gojuon", category: "katakana" },
  { char: "ム", romaji: "mu", type: "gojuon", category: "katakana" },
  { char: "メ", romaji: "me", type: "gojuon", category: "katakana" },
  { char: "モ", romaji: "mo", type: "gojuon", category: "katakana" },

  // YA YU YO
  { char: "ヤ", romaji: "ya", type: "gojuon", category: "katakana" },
  { char: "ユ", romaji: "yu", type: "gojuon", category: "katakana" },
  { char: "ヨ", romaji: "yo", type: "gojuon", category: "katakana" },

  // RA RI RU RE RO
  { char: "ラ", romaji: "ra", type: "gojuon", category: "katakana" },
  { char: "リ", romaji: "ri", type: "gojuon", category: "katakana" },
  { char: "ル", romaji: "ru", type: "gojuon", category: "katakana" },
  { char: "レ", romaji: "re", type: "gojuon", category: "katakana" },
  { char: "ロ", romaji: "ro", type: "gojuon", category: "katakana" },

  // WA WO N
  { char: "ワ", romaji: "wa", type: "gojuon", category: "katakana" },
  { char: "ヲ", romaji: "wo", type: "gojuon", category: "katakana" },
  { char: "ン", romaji: "n", type: "gojuon", category: "katakana" },

  // Dakuon (GA GI GU GE GO, etc)
  { char: "ガ", romaji: "ga", type: "dakuon", category: "katakana" },
  { char: "ギ", romaji: "gi", type: "dakuon", category: "katakana" },
  { char: "グ", romaji: "gu", type: "dakuon", category: "katakana" },
  { char: "ゲ", romaji: "ge", type: "dakuon", category: "katakana" },
  { char: "ゴ", romaji: "go", type: "dakuon", category: "katakana" },

  { char: "ザ", romaji: "za", type: "dakuon", category: "katakana" },
  { char: "ジ", romaji: "ji", type: "dakuon", category: "katakana" },
  { char: "ズ", romaji: "zu", type: "dakuon", category: "katakana" },
  { char: "ゼ", romaji: "ze", type: "dakuon", category: "katakana" },
  { char: "ゾ", romaji: "zo", type: "dakuon", category: "katakana" },

  { char: "ダ", romaji: "da", type: "dakuon", category: "katakana" },
  { char: "ヂ", romaji: "ji", type: "dakuon", category: "katakana" },
  { char: "ヅ", romaji: "zu", type: "dakuon", category: "katakana" },
  { char: "デ", romaji: "de", type: "dakuon", category: "katakana" },
  { char: "ド", romaji: "do", type: "dakuon", category: "katakana" },

  { char: "バ", romaji: "ba", type: "dakuon", category: "katakana" },
  { char: "ビ", romaji: "bi", type: "dakuon", category: "katakana" },
  { char: "ブ", romaji: "bu", type: "dakuon", category: "katakana" },
  { char: "ベ", romaji: "be", type: "dakuon", category: "katakana" },
  { char: "ボ", romaji: "bo", type: "dakuon", category: "katakana" },

  // Handakuon
  { char: "パ", romaji: "pa", type: "handakuon", category: "katakana" },
  { char: "ピ", romaji: "pi", type: "handakuon", category: "katakana" },
  { char: "プ", romaji: "pu", type: "handakuon", category: "katakana" },
  { char: "ペ", romaji: "pe", type: "handakuon", category: "katakana" },
  { char: "ポ", romaji: "po", type: "handakuon", category: "katakana" },

  // Yoon (Contracted sounds)
  { char: "キャ", romaji: "kya", type: "yoon", category: "katakana" },
  { char: "キュ", romaji: "kyu", type: "yoon", category: "katakana" },
  { char: "キョ", romaji: "kyo", type: "yoon", category: "katakana" },
  { char: "シャ", romaji: "sha", type: "yoon", category: "katakana" },
  { char: "シュ", romaji: "shu", type: "yoon", category: "katakana" },
  { char: "ショ", romaji: "sho", type: "yoon", category: "katakana" },
  { char: "チャ", romaji: "cha", type: "yoon", category: "katakana" },
  { char: "チュ", romaji: "chu", type: "yoon", category: "katakana" },
  { char: "チョ", romaji: "cho", type: "yoon", category: "katakana" },
  { char: "ニャ", romaji: "nya", type: "yoon", category: "katakana" },
  { char: "ニュ", romaji: "nyu", type: "yoon", category: "katakana" },
  { char: "ニョ", romaji: "nyo", type: "yoon", category: "katakana" },
  { char: "ヒャ", romaji: "hya", type: "yoon", category: "katakana" },
  { char: "ヒュ", romaji: "hyu", type: "yoon", category: "katakana" },
  { char: "ヒョ", romaji: "hyo", type: "yoon", category: "katakana" },
  { char: "ミャ", romaji: "mya", type: "yoon", category: "katakana" },
  { char: "ミュ", romaji: "myu", type: "yoon", category: "katakana" },
  { char: "ミョ", romaji: "myo", type: "yoon", category: "katakana" },
  { char: "リャ", romaji: "rya", type: "yoon", category: "katakana" },
  { char: "リュ", romaji: "ryu", type: "yoon", category: "katakana" },
  { char: "リョ", romaji: "ryo", type: "yoon", category: "katakana" },
  { char: "ギャ", romaji: "gya", type: "yoon", category: "katakana" },
  { char: "ギュ", romaji: "gyu", type: "yoon", category: "katakana" },
  { char: "ギョ", romaji: "gyo", type: "yoon", category: "katakana" },
  { char: "ジャ", romaji: "ja", type: "yoon", category: "katakana" },
  { char: "ジュ", romaji: "ju", type: "yoon", category: "katakana" },
  { char: "ジョ", romaji: "jo", type: "yoon", category: "katakana" },
  { char: "ビャ", romaji: "bya", type: "yoon", category: "katakana" },
  { char: "ビュ", romaji: "byu", type: "yoon", category: "katakana" },
  { char: "ビョ", romaji: "byo", type: "yoon", category: "katakana" },
  { char: "ピャ", romaji: "pya", type: "yoon", category: "katakana" },
  { char: "ピュ", romaji: "pyu", type: "yoon", category: "katakana" },
  { char: "ピョ", romaji: "pyo", type: "yoon", category: "katakana" }
];
