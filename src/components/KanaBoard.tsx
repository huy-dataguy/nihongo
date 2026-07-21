import React, { useMemo, useState } from "react";
import { hiraganaData, katakanaData } from "../data/kanaData";
import { speakJapanese } from "../utils/audio";
import { Volume2, Eye, EyeOff, ChevronDown, Filter, Target } from "lucide-react";
import { KanaCharacter } from "../types";

// --- Bố cục bảng 五十音: mỗi cột = 1 nguyên âm, các cột xếp phải→trái (a,i,u,e,o) ---
const VOWELS_5 = ["a", "i", "u", "e", "o"];
const VOWELS_3 = ["a", "u", "o"]; // Yōon chỉ có 3 cột (a, u, o)

// Layout theo char hiragana (null = ô trống giữ chỗ để cột thẳng hàng)
const KANA_LAYOUT: Record<string, (string | null)[][]> = {
  gojuon: [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", null, "ゆ", null, "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", null, null, null, "を"],
    ["ん", null, null, null, null],
  ],
  dakuon: [
    ["が", "ぎ", "ぐ", "げ", "ご"],
    ["ざ", "じ", "ず", "ぜ", "ぞ"],
    ["だ", "ぢ", "づ", "で", "ど"],
    ["ば", "び", "ぶ", "べ", "ぼ"],
  ],
  handakuon: [["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]],
  yoon: [
    ["きゃ", "きゅ", "きょ"],
    ["しゃ", "しゅ", "しょ"],
    ["ちゃ", "ちゅ", "ちょ"],
    ["にゃ", "にゅ", "にょ"],
    ["ひゃ", "ひゅ", "ひょ"],
    ["みゃ", "みゅ", "みょ"],
    ["りゃ", "りゅ", "りょ"],
    ["ぎゃ", "ぎゅ", "ぎょ"],
    ["じゃ", "じゅ", "じょ"],
    ["びゃ", "びゅ", "びょ"],
    ["ぴゃ", "ぴゅ", "ぴょ"],
  ],
};

const KANA_TYPE_META: { type: "gojuon" | "dakuon" | "handakuon" | "yoon"; label: string; vowels: string[] }[] = [
  { type: "gojuon", label: "Âm thuần — Gojūon", vowels: VOWELS_5 },
  { type: "dakuon", label: "Âm đục — Dakuon", vowels: VOWELS_5 },
  { type: "handakuon", label: "Âm bán đục — Handakuon", vowels: VOWELS_5 },
  { type: "yoon", label: "Âm ghép — Yōon", vowels: VOWELS_3 },
];

// Chuyển slot hiragana sang chữ đang xem: cộng 0x60 cho mỗi ký tự trong block hiragana → katakana
function hiraToActive(hira: string, isKatakana: boolean): string {
  if (!isKatakana) return hira;
  return Array.from(hira)
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      return code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : ch;
    })
    .join("");
}

interface KanaBoardProps {
  onPractice?: () => void;
}

export default function KanaBoard({ onPractice }: KanaBoardProps) {
  const [selectedKana, setSelectedKana] = useState<"hiragana" | "katakana">("hiragana");
  const [activeTab, setActiveTab] = useState<"all" | "gojuon" | "dakuon" | "handakuon" | "yoon">("all");
  const [showRomaji, setShowRomaji] = useState<boolean>(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);

  const filterOptions = [
    { value: "all", label: "Tất cả các âm" },
    { value: "gojuon", label: "Âm thuần (Gojūon)" },
    { value: "dakuon", label: "Âm đục (Dakuon)" },
    { value: "handakuon", label: "Âm bán đục (Handakuon)" },
    { value: "yoon", label: "Âm ghép (Yōon)" },
  ] as const;

  const activeOption = filterOptions.find(opt => opt.value === activeTab) || filterOptions[0];

  const dataset = selectedKana === "hiragana" ? hiraganaData : katakanaData;

  // Bảng tra char -> kana (để render theo slot layout)
  const charMap = useMemo(() => {
    const m = new Map<string, KanaCharacter>();
    dataset.forEach((c) => m.set(c.char, c));
    return m;
  }, [dataset]);

  const isKatakana = selectedKana === "katakana";
  const typesToShow =
    activeTab === "all" ? KANA_TYPE_META : KANA_TYPE_META.filter((t) => t.type === activeTab);

  return (
    <div className="learning-board bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <span className="eyebrow">Nền tảng phát âm</span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">Bảng chữ Kana</h2>
          <p className="text-sm text-gray-500 mt-1">Chạm để nghe, ẩn Romaji để tự gợi nhớ rồi kiểm tra ngay.</p>
        </div>

        {/* Romaji visibility & Hiragana / Katakana toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {onPractice && <button onClick={onPractice} className="board-practice-button"><Target size={14} /> Kiểm tra Kana</button>}
          <button
            onClick={() => setShowRomaji(!showRomaji)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            {showRomaji ? <EyeOff size={14} /> : <Eye size={14} />}
            {showRomaji ? "Ẩn Romaji" : "Hiện Romaji"}
          </button>

          <div className="relative bg-stone-100/80 p-1 rounded-xl flex items-center shadow-xs border border-stone-200/10 w-full sm:w-auto min-w-[200px] sm:min-w-[220px]">
            {/* Absolute dynamic background pill slider */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-xs border border-amber-200/60 transition-all duration-300 ease-out"
              style={{
                width: "calc(50% - 4px)",
                left: selectedKana === "hiragana" ? "4px" : "calc(50% + 2px)",
              }}
            />

            <button
              onClick={() => setSelectedKana("hiragana")}
              className={`relative z-10 flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-colors duration-250 ${
                selectedKana === "hiragana"
                  ? "text-amber-800"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Hiragana
            </button>
            <button
              onClick={() => setSelectedKana("katakana")}
              className={`relative z-10 flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-colors duration-250 ${
                selectedKana === "katakana"
                  ? "text-amber-800"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Katakana
            </button>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="relative mb-6 z-30 inline-block text-left">
        <button
          type="button"
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/80 hover:border-amber-300 text-gray-700 hover:text-gray-900 text-xs font-semibold rounded-lg border border-gray-200 transition-all shadow-xs"
        >
          <Filter size={13} className="text-gray-400" />
          <span>Bộ lọc âm: <strong className="text-amber-800 ml-1">{activeOption.label}</strong></span>
          <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isFilterDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsFilterDropdownOpen(false)}
            />
            <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white border border-gray-150 shadow-lg py-1.5 z-50 animate-fade">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setActiveTab(opt.value);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === opt.value
                      ? "bg-amber-50/60 text-amber-900 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{opt.label}</span>
                  {activeTab === opt.value && <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bảng chữ cái: bố cục 五十音 — mỗi cột = 1 nguyên âm, các cột xếp PHẢI→TRÁI (a,i,u,e,o) */}
      <div className="space-y-7">
        {typesToShow.map(({ type, label, vowels }) => (
          <div key={type}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
              {label}
            </h3>
            <div
              dir="rtl"
              className="inline-grid gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${vowels.length}, minmax(0, 1fr))` }}
            >
              {/* Hàng tiêu đề nguyên âm */}
              {vowels.map((v) => (
                <div
                  key={`hdr-${type}-${v}`}
                  dir="ltr"
                  className="w-12 sm:w-14 text-center text-[10px] font-mono font-bold text-amber-500/70 pb-1"
                >
                  {v}
                </div>
              ))}
              {/* Các ô kana (theo hàng phụ âm, cột nguyên âm) */}
              {KANA_LAYOUT[type].map((row, ri) =>
                row.map((slot, ci) => {
                  const key = `${type}-${ri}-${ci}`;
                  if (!slot) return <div key={key} className="w-12 h-14 sm:w-14 sm:h-16" />;
                  const char = hiraToActive(slot, isKatakana);
                  const kana = charMap.get(char);
                  if (!kana) return <div key={key} className="w-12 h-14 sm:w-14 sm:h-16" />;
                  return (
                    <button
                      key={key}
                      dir="ltr"
                      onClick={() => speakJapanese(kana.char)}
                      className="group relative flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 bg-gray-50/50 hover:bg-amber-50/40 rounded-lg border border-gray-100 hover:border-amber-200 cursor-pointer transition-all duration-200 text-center shadow-xs"
                      aria-label={`${kana.char}, đọc là ${kana.romaji}`}
                    >
                      <span className="text-base sm:text-lg font-bold font-sans text-gray-800 group-hover:text-amber-700 transition-colors leading-none">
                        {kana.char}
                      </span>
                      {showRomaji && (
                        <span className="mt-1 text-[8px] sm:text-[9px] font-mono font-medium text-gray-400 uppercase tracking-wider">
                          {kana.romaji}
                        </span>
                      )}
                      <span
                        className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-amber-600 rounded bg-white shadow-xs transition-opacity"
                        aria-hidden="true"
                      >
                        <Volume2 size={10} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
