import React, { useState, useMemo, Fragment } from "react";
import { GrammarItem, GrammarExample } from "../types";
import { speakJapanese } from "../utils/audio";
import { kanaToRomaji } from "../utils/kanaToRomaji";
import VerbConjugationBoard from "./VerbConjugationBoard";
import { ChevronDown, ChevronUp, Volume2, BookOpen, Clock, Search, Target, ArrowRightLeft, Layers } from "lucide-react";

// ============================================
// Keyword Highlighting System
// ============================================

// Trợ từ (particles)
const PARTICLES: Record<string, string> = {
  "は": "wa (chủ đề)",
  "が": "ga (chủ ngữ)",
  "を": "wo (tân ngữ)",
  "に": "ni (địa điểm/thời gian/đích)",
  "で": "de (nơi thực hiện/phương tiện)",
  "へ": "e (hướng đến)",
  "と": "to (và/cùng)",
  "も": "mo (cũng)",
  "の": "no (của/liên kết)",
  "から": "kara (từ/bởi vì)",
  "まで": "made (đến)",
  "より": "yori (hơn)",
  "だけ": "dake (chỉ)",
  "しか": "shika (chỉ...phủ định)",
  "ね": "ne (nhỉ)",
  "よ": "yo (nhé)",
};

// Từ để hỏi (question words)
const QUESTION_WORDS: Record<string, string> = {
  "なに": "nani (gì)",
  "なん": "nan (gì)",
  "だれ": "dare (ai)",
  "どなた": "donata (ai - lịch sự)",
  "どこ": "doko (ở đâu)",
  "どちら": "dochira (ở đâu/hướng nào)",
  "いつ": "itsu (khi nào)",
  "いくら": "ikura (bao nhiêu tiền)",
  "いくつ": "ikutsu (bao nhiêu)",
  "なぜ": "naze (tại sao)",
  "どうして": "doushite (tại sao)",
  "どう": "dou (như thế nào)",
  "どんな": "donna (loại nào)",
  "どれ": "dore (cái nào)",
  "なんようび": "nan'youbi (thứ mấy)",
  "なんじ": "nanji (mấy giờ)",
  "なんがつ": "nangatsu (tháng mấy)",
  "なんにち": "nannichi (ngày mấy)",
  "なんさい": "nansai (bao nhiêu tuổi)",
};

// Đảo thứ tự: key dài nhất trước để tránh match sai (e.g. "どうして" trước "どう")
const sortedParticleKeys = Object.keys(PARTICLES).sort((a, b) => b.length - a.length);
const sortedQuestionKeys = Object.keys(QUESTION_WORDS).sort((a, b) => b.length - a.length);

type HighlightType = "particle" | "question" | "none";

function findHighlights(text: string): { start: number; end: number; type: HighlightType; tip: string }[] {
  const matches: { start: number; end: number; type: HighlightType; tip: string }[] = [];

  // Tìm từ để hỏi trước (ưu tiên cao hơn)
  for (const key of sortedQuestionKeys) {
    let pos = 0;
    while ((pos = text.indexOf(key, pos)) !== -1) {
      matches.push({ start: pos, end: pos + key.length, type: "question", tip: QUESTION_WORDS[key] });
      pos += key.length;
    }
  }

  // Tìm trợ từ
  for (const key of sortedParticleKeys) {
    let pos = 0;
    while ((pos = text.indexOf(key, pos)) !== -1) {
      // Skip nếu vị trí này đã được question word chiếm
      const overlap = matches.some(m => pos >= m.start && pos < m.end);
      if (!overlap) {
        matches.push({ start: pos, end: pos + key.length, type: "particle", tip: PARTICLES[key] });
      }
      pos += key.length;
    }
  }

  // Sort by position, loại overlap
  matches.sort((a, b) => a.start - b.start);
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  return filtered;
}

/**
 * Highlight Japanese text: particles → amber, question words → blue
 * Returns React elements with <span> wraps + tooltip on hover
 */
function highlightJapanese(text: string): React.ReactNode {
  const highlights = findHighlights(text);
  if (highlights.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (const h of highlights) {
    // Text trước highlight
    if (h.start > lastEnd) {
      parts.push(<Fragment key={`t-${lastEnd}`}>{text.slice(lastEnd, h.start)}</Fragment>);
    }

    const highlighted = text.slice(h.start, h.end);
    const isParticle = h.type === "particle";

    parts.push(
      <span
        key={`h-${h.start}`}
        className={`${isParticle ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" : "bg-blue-100 text-blue-800 ring-1 ring-blue-200"} rounded-sm px-0.5 font-bold cursor-help relative group/highlight`}
        title={h.tip}
      >
        {highlighted}
        {/* Tooltip on hover */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/highlight:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          {h.tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
        </span>
      </span>
    );

    lastEnd = h.end;
  }

  // Text sau highlight cuối
  if (lastEnd < text.length) {
    parts.push(<Fragment key={`t-${lastEnd}`}>{text.slice(lastEnd)}</Fragment>);
  }

  return parts;
}

interface GrammarBoardProps {
  grammarList: GrammarItem[];
  onPractice?: () => void;
}

export default function GrammarBoard({ grammarList, onPractice }: GrammarBoardProps) {
  const [subTab, setSubTab] = useState<"grammar" | "verbConjugation">("grammar");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Extract weeks/categories
  const categories = useMemo(() => {
    const list = grammarList.map((item) => item.category || "Chưa phân loại");
    return ["all", ...Array.from(new Set(list))];
  }, [grammarList]);

  // Filter based on week selection
  const filteredGrammar = useMemo(() => {
    const query = search.trim().toLowerCase();
    return grammarList.filter((item) => {
      if (selectedCategory !== "all" && (item.category || "Chưa phân loại") !== selectedCategory) return false;
      if (!query) return true;
      return [item.structure, item.meaning, item.explanation, item.notes || "", item.category || ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [grammarList, selectedCategory, search]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="learning-board bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <span className="eyebrow">Ngữ pháp & Thể động từ</span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">Ngữ pháp N5</h2>
          <p className="text-sm text-gray-500 mt-1">Hiểu cấu trúc trong ngữ cảnh và quy tắc chia các thể động từ tiếng Nhật.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SubTab Toggle Bar */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setSubTab("grammar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                subTab === "grammar" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BookOpen size={13} /> Mẫu câu Ngữ pháp
            </button>
            <button
              onClick={() => setSubTab("verbConjugation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                subTab === "verbConjugation" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowRightLeft size={13} /> Bảng Quy tắc Chia thể
            </button>
          </div>

          {onPractice && <button onClick={onPractice} className="board-practice-button"><Target size={14} /> Kiểm tra ngữ pháp</button>}
        </div>
      </div>

      {subTab === "verbConjugation" ? (
        <VerbConjugationBoard />
      ) : (
        <>
          <div className="grammar-toolbar">
            <label className="grammar-search">
              <Search size={15} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm cấu trúc, ý nghĩa hoặc ghi chú..." />
            </label>
            {/* Categories selector */}
            <div className="flex items-center gap-1.5 self-start md:self-auto bg-gray-100 p-1.5 rounded-xl text-xs overflow-x-auto w-full md:w-auto">
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 font-semibold rounded-lg shrink-0 transition-all ${
                    selectedCategory === category
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {category === "all" ? "📁 Tất cả" : category}
                </button>
              ))}
              {categories.length > 5 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-0 text-gray-500 hover:text-gray-900 font-semibold text-xs px-2 focus:outline-none"
                >
                  <option disabled value="">Khác...</option>
                  {categories.slice(5).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <p className="grammar-result-count">Hiển thị {filteredGrammar.length} / {grammarList.length} cấu trúc</p>

          {/* Main List */}
          <div className="space-y-4">
            {filteredGrammar.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Chưa có ngữ pháp nào trong tuần này.</p>
                <p className="text-xs text-gray-400 mt-1">Hãy đổi bộ lọc hoặc sử dụng Import bài học để thêm ngữ pháp.</p>
              </div>
            ) : (
              filteredGrammar.map((item, index) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl transition-all duration-200 ${
                      isExpanded
                        ? "border-amber-200 bg-amber-50/5/10 shadow-xs"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    {/* Header bar (Luôn hiển thị) */}
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="grammar-number">#{index + 1}</span>
                        <div className="min-w-0">
                          <h3 className="grammar-structure">
                            {item.structure}
                          </h3>
                          <p className="grammar-meaning">
                            {item.meaning}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.category && (
                          <span className="grammar-category-badge">
                            {item.category}
                          </span>
                        )}
                        <div className="text-gray-400 hover:text-gray-600 transition-colors">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Content mở rộng (Chi tiết giải thích & Ví dụ) */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-1 border-t border-gray-100 space-y-4 animate-fadeIn">
                        {/* Giải thích chi tiết */}
                        {item.explanation && (
                          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              💡 Giải thích cách dùng:
                            </span>
                            <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>
                        )}

                        {/* Ghi chú lưu ý */}
                        {item.notes && (
                          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                              ⚠️ Ghi chú / Bẫy ngữ pháp:
                            </span>
                            <p className="text-xs text-amber-900 leading-relaxed">
                              {item.notes}
                            </p>
                          </div>
                        )}

                        {/* Danh sách ví dụ */}
                        {item.examples && item.examples.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                              📝 Ví dụ câu minh họa:
                            </span>
                            <div className="space-y-2">
                              {item.examples.map((ex, exIdx) => {
                                const rom = kanaToRomaji(ex.japanese);
                                return (
                                  <div
                                    key={exIdx}
                                    className="bg-white p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors flex items-start justify-between gap-3 group"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {highlightJapanese(ex.japanese)}
                                      </div>
                                      {rom && (
                                        <div className="text-[11px] font-mono text-amber-700/80">
                                          {rom}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-600">
                                        {ex.vietnamese}
                                      </div>
                                    </div>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakJapanese(ex.japanese);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors shrink-0"
                                      title="Phát âm câu ví dụ"
                                    >
                                      <Volume2 size={16} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
