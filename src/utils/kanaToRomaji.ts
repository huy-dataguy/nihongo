/**
 * Convert Hiragana / Katakana string to Romaji (Hepburn).
 * Covers: gojuon, dakuon, handakuon, yoon, sokuon (っ/ッ), chōonpu (ー).
 */

// Basic kana → romaji
const KANA_MAP: Record<string, string> = {
  "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
  "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
  "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
  "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
  "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
  "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
  "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
  "や": "ya", "ゆ": "yu", "よ": "yo",
  "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
  "わ": "wa", "を": "wo", "ん": "n",
  // dakuon
  "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
  "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
  "だ": "da", "ぢ": "di", "づ": "du", "で": "de", "ど": "do",
  "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
  // handakuon
  "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
};

// Katakana → hiragana mapping (codepoint offset)
const KATA_TO_HIRA: Record<string, string> = {};
(function () {
  for (let i = 0; i < 86; i++) {
    KATA_TO_HIRA[String.fromCodePoint(0x30a1 + i)] = String.fromCodePoint(0x3041 + i);
  }
})();

// Complete yoon map: base kana → small kana → romaji
const YOON_MAP: Record<string, Record<string, string>> = {
  "き": { "ゃ": "kya", "ゅ": "kyu", "ょ": "kyo" },
  "ぎ": { "ゃ": "gya", "ゅ": "gyu", "ょ": "gyo" },
  "し": { "ゃ": "sha", "ゅ": "shu", "ょ": "sho" },
  "じ": { "ゃ": "ja",  "ゅ": "ju",  "ょ": "jo" },
  "ち": { "ゃ": "cha", "ゅ": "chu", "ょ": "cho" },
  "に": { "ゃ": "nya", "ゅ": "nyu", "ょ": "nyo" },
  "ひ": { "ゃ": "hya", "ゅ": "hyu", "ょ": "hyo" },
  "び": { "ゃ": "bya", "ゅ": "byu", "ょ": "byo" },
  "ぴ": { "ゃ": "pya", "ゅ": "pyu", "ょ": "pyo" },
  "み": { "ゃ": "mya", "ゅ": "myu", "ょ": "myo" },
  "り": { "ゃ": "rya", "ゅ": "ryu", "ょ": "ryo" },
};

// Sokuon doubling: for the romaji string of the next mora,
// what prefix to insert for っ
const SOKUON_DOUBLE: Record<string, string> = {
  "k": "k", "g": "k", "s": "s", "z": "s",
  "t": "t", "d": "t", "h": "h", "b": "h", "p": "p",
  "f": "f", "m": "m", "y": "y", "r": "r", "w": "w",
  // sh/ch need special handling
  "sh": "s", "ch": "t", "j": "j",
};

// Small yoon chars
const SMALL_YOON = new Set(["ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ"]);

/**
 * Convert a kana string (hiragana/katakana) to romaji.
 * Non-kana characters (kanji, latin, punctuation) pass through unchanged.
 */
export function kanaToRomaji(text: string): string {
  if (!text) return "";

  let result = "";
  const chars = [...text];
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const ch = chars[i];
    const next = chars[i + 1] || "";
    const hCh = toHira(ch);

    // --- Sokuon (促音): small tsu → double next consonant ---
    if (ch === "っ" || ch === "ッ") {
      const mora = peekMora(next, chars[i + 2] || "");
      if (mora) {
        const prefix = getSokuonPrefix(mora);
        result += prefix;
      } else {
        result += "'";
      }
      continue;
    }

    // --- Chōonpu (長音符): ー → extend previous vowel ---
    if (ch === "ー") {
      const v = lastVowel(result);
      if (v) result += v;
      continue;
    }

    // --- ん (n) special ---
    if (hCh === "ん") {
      const hNext = toHira(next);
      if (hNext && "ばびぶべぼぱぴぷぺぽまみむめも".includes(hNext)) {
        result += "m";
      } else if (hNext && "あいうえおやゆよ".includes(hNext)) {
        // Before vowel/y-sound: n' for disambiguation (e.g. きんえん → kin'en)
        result += "n'";
      } else {
        // Before consonant or end of string: just n
        result += "n";
      }
      continue;
    }

    // --- Yoon (拗音): e.g. き+ゃ → kya ---
    if (YOON_MAP[hCh] && SMALL_YOON.has(next)) {
      const yoon = YOON_MAP[hCh][toHira(next)];
      if (yoon) {
        result += yoon;
        i++; // skip the small yoon char
        continue;
      }
    }

    // --- Standard kana ---
    const romaji = KANA_MAP[hCh];
    if (romaji) {
      result += romaji;
      continue;
    }

    // --- Fallback: pass through ---
    result += ch;
  }

  return result;
}

/** Peek at the next mora's full romaji (handles yoon) */
function peekMora(ch: string, after: string): string {
  const hCh = toHira(ch);
  if (YOON_MAP[hCh] && SMALL_YOON.has(after)) {
    return YOON_MAP[hCh][toHira(after)] || KANA_MAP[hCh] || "";
  }
  return KANA_MAP[hCh] || "";
}

/** Get the consonant to double for sokuon */
function getSokuonPrefix(moraRomaji: string): string {
  // Check multi-char prefixes first
  if (moraRomaji.startsWith("ch")) return "t";   // っちょう → tchou
  if (moraRomaji.startsWith("sh")) return "s";   // っしょう → sshou
  // Single consonant
  const first = moraRomaji.charAt(0);
  if (SOKUON_DOUBLE[first]) return SOKUON_DOUBLE[first];
  return first;
}

/** Find the last vowel in the string */
function lastVowel(s: string): string {
  for (let i = s.length - 1; i >= 0; i--) {
    if ("aiueo".includes(s[i])) return s[i];
  }
  return "";
}

/** Convert katakana char to hiragana */
function toHira(ch: string): string {
  return KATA_TO_HIRA[ch] || ch;
}

/**
 * Smart romaji: if the item already has romaji, use it;
 * otherwise convert from reading (kana).
 */
export function getRomaji(reading: string, romaji?: string): string {
  if (romaji && romaji.trim()) return romaji.trim();
  return kanaToRomaji(reading);
}
