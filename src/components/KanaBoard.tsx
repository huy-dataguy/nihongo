import React, { useState } from "react";
import { hiraganaData, katakanaData } from "../data/kanaData";
import { speakJapanese } from "../utils/audio";
import { Volume2, Eye, EyeOff, Search, BookOpen, ChevronDown, Filter } from "lucide-react";
import { KanjiItem } from "../types";

interface KanaBoardProps {
  kanjiList?: KanjiItem[];
}

export default function KanaBoard({ kanjiList = [] }: KanaBoardProps) {
  const [selectedKana, setSelectedKana] = useState<"hiragana" | "katakana" | "kanji">("hiragana");
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

  // Kanji-specific state within KanaBoard
  const [kanjiSearch, setKanjiSearch] = useState("");
  const [selectedKanji, setSelectedKanji] = useState<KanjiItem | null>(null);

  const dataset = selectedKana === "hiragana" ? hiraganaData : katakanaData;

  const filteredDataset = dataset.filter((char) => {
    if (activeTab === "all") return true;
    return char.type === activeTab;
  });

  // Filter Kanji list if Kanji is selected
  const filteredKanji = kanjiList.filter((item) => {
    return (
      item.character.includes(kanjiSearch) ||
      item.meaning.toLowerCase().includes(kanjiSearch.toLowerCase()) ||
      item.onyomi.toLowerCase().includes(kanjiSearch.toLowerCase()) ||
      item.kunyomi.toLowerCase().includes(kanjiSearch.toLowerCase())
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Học bảng chữ & Chữ Hán</h2>
          <p className="text-sm text-gray-500 mt-1">Luyện nhớ mặt chữ Hiragana, Katakana và hệ thống Kanji N5</p>
        </div>

        {/* Romaji visibility & Kana / Kanji toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedKana !== "kanji" && (
            <button
              onClick={() => setShowRomaji(!showRomaji)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              {showRomaji ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRomaji ? "Ẩn Romaji" : "Hiện Romaji"}
            </button>
          )}

          <div className="relative bg-stone-100/80 p-1 rounded-xl flex items-center shadow-xs border border-stone-200/10 w-full sm:w-auto min-w-[280px] sm:min-w-[320px]">
            {/* Absolute dynamic background pill slider slider */}
            <div 
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-xs border border-amber-200/60 transition-all duration-300 ease-out"
              style={{
                width: "calc(33.333% - 6px)",
                left: selectedKana === "hiragana" 
                  ? "4px" 
                  : selectedKana === "katakana" 
                    ? "calc(33.333% + 3px)" 
                    : "calc(66.666% + 2px)"
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
            <button
              onClick={() => setSelectedKana("kanji")}
              className={`relative z-10 flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-colors duration-250 ${
                selectedKana === "kanji"
                  ? "text-amber-800"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Kanji ({kanjiList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Kana Rows vs Kanji view */}
      {selectedKana !== "kanji" ? (
        <>
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

          {/* Characters list */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredDataset.map((char, index) => (
              <div
                key={`${char.category}-${char.char}-${index}`}
                onClick={() => speakJapanese(char.char)}
                className="group relative flex flex-col items-center justify-between p-4 bg-gray-50/50 hover:bg-amber-50/40 rounded-xl border border-gray-100 hover:border-amber-200 cursor-pointer transition-all duration-200 text-center shadow-xs"
              >
                <span className="text-3xl font-bold font-sans text-gray-800 group-hover:text-amber-700 transition-colors">
                  {char.char}
                </span>
                
                <div className="mt-2.5 flex items-center justify-center gap-1 min-h-[20px]">
                  {showRomaji && (
                    <span className="text-xs font-mono font-medium text-gray-500 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">
                      {char.romaji}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(char.char);
                  }}
                  className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-amber-600 rounded bg-white shadow-xs transition-opacity"
                  title="Phát âm"
                >
                  <Volume2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Unified Kanji Explorer inside Bảng chữ cái */
        <div className="space-y-6">
          {/* Sub-search filters for Kanji inside KanaBoard */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm chữ Hán, nghĩa, âm On/Kun..."
              value={kanjiSearch}
              onChange={(e) => setKanjiSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-xl border border-gray-200 focus:border-amber-300 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grid display on left */}
            <div className="md:col-span-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredKanji.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedKanji(item)}
                  className={`p-4 rounded-xl border text-center cursor-pointer transition-all duration-200 select-none ${
                    selectedKanji?.id === item.id
                      ? "bg-amber-50/50 border-amber-300 shadow-sm"
                      : "bg-gray-50/40 hover:bg-white border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <div className="text-3xl font-bold text-gray-800 font-sans">{item.character}</div>
                  <div className="text-[10px] font-bold text-stone-700 bg-stone-100 py-0.5 px-1.5 rounded-md mt-1.5 truncate">
                    {item.meaning.split(" ")[0]}
                  </div>
                </div>
              ))}

              {filteredKanji.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs font-semibold">Không tìm thấy chữ Hán nào.</p>
                </div>
              )}
            </div>

            {/* Quick Details inspection panel on right */}
            <div className="bg-stone-50/50 border border-stone-200/60 rounded-2xl p-4 space-y-4">
              {selectedKanji ? (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-amber-100 flex items-center justify-center text-3xl font-bold text-gray-900 shadow-xs shrink-0">
                      {selectedKanji.character}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 font-serif leading-none">{selectedKanji.meaning}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">Ý nghĩa / Hán Việt</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-150/40 pt-2.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 block font-mono">Cách đọc Onyomi</span>
                      <p className="text-amber-900 font-medium">{selectedKanji.onyomi || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 block font-mono">Cách đọc Kunyomi</span>
                      <p className="text-emerald-950 font-medium">{selectedKanji.kunyomi || "-"}</p>
                    </div>
                  </div>

                  {selectedKanji.examples && selectedKanji.examples.length > 0 && (
                    <div className="border-t border-gray-150/40 pt-2.5">
                      <span className="text-[9px] font-semibold text-gray-400 block font-mono mb-1.5">Từ ghép tham khảo</span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {selectedKanji.examples.map((ex, i) => (
                          <div key={i} className="bg-white p-2 rounded-lg border border-gray-100 text-[11px] flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800">{ex.word} ({ex.reading})</p>
                              <p className="text-gray-500 font-medium">{ex.meaning}</p>
                            </div>
                            <button
                              onClick={() => speakJapanese(ex.word)}
                              className="p-1 text-gray-400 hover:text-amber-700"
                            >
                              <Volume2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center min-h-[220px]">
                  <BookOpen className="h-8 w-8 text-gray-350 mb-2" />
                  <p className="text-xs text-gray-500 font-semibold">Chạm vào một Chữ Hán</p>
                  <p className="text-[10px] text-gray-400 mt-1">Để xem định nghĩa On, Kun và từ ghép ví dụ trực tiếp dạng nhanh.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
