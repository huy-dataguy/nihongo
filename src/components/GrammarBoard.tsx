import React, { useState, useMemo, Fragment } from "react";
import { GrammarItem, GrammarExample } from "../types";
import { speakJapanese } from "../utils/audio";
import { ChevronDown, ChevronUp, Volume2, BookOpen, Clock, Search, Target } from "lucide-react";

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
          <span className="eyebrow">Mẫu câu ứng dụng</span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">Ngữ pháp N5</h2>
          <p className="text-sm text-gray-500 mt-1">Hiểu cấu trúc trong ngữ cảnh, sau đó tự chọn lại cách dùng đúng.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onPractice && <button onClick={onPractice} className="board-practice-button"><Target size={14} /> Kiểm tra ngữ pháp</button>}
        </div>
      </div>

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
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none w-full text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 font-mono">
                        {item.structure}
                      </span>
                      {item.isCustom && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-100">
                          Bộ học sinh
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-amber-800">{item.meaning}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.category && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
                        {item.category}
                      </span>
                    )}
                    <span className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-gray-100/60 bg-gray-50/40 rounded-b-xl space-y-4">
                    {/* Notes */}
                    {item.notes && (
                      <div className="pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ghi chú</h4>
                        <p className="text-amber-800 text-sm bg-amber-50 p-3 rounded-xl border border-amber-100">
                          💡 {item.notes}
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    {(item.explanation || item.meaning) && (
                      <div className={item.notes ? "" : "pt-4"}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Giải thích cách dùng</h4>
                        <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                          {item.explanation || item.meaning}
                        </p>
                      </div>
                    )}

                    {/* Conjugation Tables */}
                    {item.conjugationTables && Object.keys(item.conjugationTables).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bảng chia</h4>
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-xs">
                          {renderConjugationTable(item.conjugationTables)}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {item.summary && Object.keys(item.summary).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tóm tắt</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(item.summary).map(([key, val]) => (
                            <div key={key} className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs">
                              <span className="font-bold text-gray-500 capitalize">{formatSummaryKey(key)}:</span>
                              <span className="ml-1.5 text-gray-700">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {item.examples && item.examples.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                          <Clock size={12} />
                          Câu ví dụ ứng dụng
                        </h4>
                        {/* Highlight Legend */}
                        <div className="flex items-center gap-3 mb-2 text-[10px]">
                          <span className="flex items-center gap-1">
                            <span className="bg-amber-100 text-amber-800 ring-1 ring-amber-200 rounded-sm px-1 font-bold">は</span>
                            <span className="text-gray-400">Trợ từ</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="bg-blue-100 text-blue-800 ring-1 ring-blue-200 rounded-sm px-1 font-bold">どこ</span>
                            <span className="text-gray-400">Từ để hỏi</span>
                          </span>
                          <span className="text-gray-300">• Hover để xem nghĩa</span>
                        </div>

                        <div className="space-y-2.5">
                          {item.examples.map((example, i) => renderExample(example, i))}
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
    </div>
  );

  // ============================================
  // Helper render functions
  // ============================================

  function renderExample(ex: GrammarExample, i: number) {
    // Q&A format (cau_hoi / cau_tra_loi)
    if (ex.cau_hoi) {
      return (
        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 space-y-2 hover:border-amber-200 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-amber-600 font-bold">❓ Câu hỏi:</p>
              <p className="text-sm font-semibold text-gray-900">{highlightJapanese(ex.cau_hoi)}</p>
              {ex.dich_cau_hoi && <p className="text-xs text-gray-500">{ex.dich_cau_hoi}</p>}
            </div>
            <button onClick={() => speakJapanese(ex.cau_hoi)} className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors shrink-0" title="Nghe">
              <Volume2 size={14} />
            </button>
          </div>
          {ex.cau_tra_loi && (
            <div className="border-t border-gray-50 pt-2 space-y-1">
              <p className="text-xs text-green-600 font-bold">💬 Trả lời:</p>
              <p className="text-sm font-semibold text-gray-900">{highlightJapanese(ex.cau_tra_loi)}</p>
              {ex.dich_cau_tra_loi && <p className="text-xs text-gray-500">{ex.dich_cau_tra_loi}</p>}
            </div>
          )}
          {ex.tra_loi_khang_dinh && (
            <div className="border-t border-gray-50 pt-2 space-y-1">
              <p className="text-xs text-green-600 font-bold">✅ Khẳng định:</p>
              <p className="text-sm text-gray-800">{highlightJapanese(ex.tra_loi_khang_dinh)}</p>
              {ex.dich_khang_dinh && <p className="text-xs text-gray-500">{ex.dich_khang_dinh}</p>}
            </div>
          )}
          {ex.tra_loi_phu_dinh && (
            <div className="border-t border-gray-50 pt-2 space-y-1">
              <p className="text-xs text-rose-600 font-bold">❌ Phủ định:</p>
              <p className="text-sm text-gray-800">{highlightJapanese(ex.tra_loi_phu_dinh)}</p>
              {ex.dich_phu_dinh && <p className="text-xs text-gray-500">{ex.dich_phu_dinh}</p>}
            </div>
          )}
        </div>
      );
    }

    // Statement format (tieng_nhat / tieng_viet)
    if (ex.tieng_nhat) {
      return (
        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-start justify-between gap-4 hover:border-amber-200 transition-colors group">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">{highlightJapanese(ex.tieng_nhat)}</p>
            {ex.tieng_viet && <p className="text-xs text-gray-500">{ex.tieng_viet}</p>}
          </div>
          <button onClick={() => speakJapanese(ex.tieng_nhat)} className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors shrink-0" title="Nghe">
            <Volume2 size={14} />
          </button>
        </div>
      );
    }

    // Legacy format (japanese / reading / meaning)
    if (ex.japanese) {
      return (
        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-start justify-between gap-4 hover:border-amber-200 transition-colors group">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">{highlightJapanese(ex.japanese)}</p>
            {ex.reading && <p className="text-xs text-gray-400 italic">[{ex.reading}]</p>}
            {ex.meaning && <p className="text-xs text-gray-600">{ex.meaning}</p>}
          </div>
          <button onClick={() => speakJapanese(ex.japanese)} className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors shrink-0" title="Nghe">
            <Volume2 size={14} />
          </button>
        </div>
      );
    }

    return null;
  }

  function renderConjugationTable(tables: Record<string, any>) {
    return (
      <div className="space-y-2 p-3">
        {Object.entries(tables).map(([title, data]) => (
          <div key={title}>
            <p className="font-bold text-gray-600 text-xs mb-1.5">{formatSummaryKey(title)}</p>
            {typeof data === "object" && data !== null ? (
              <div className="grid grid-cols-2 gap-1.5">
                {renderTableRows(data)}
              </div>
            ) : (
              <p className="text-gray-600">{String(data)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderTableRows(data: Record<string, any>, depth = 0): React.ReactNode[] {
    const rows: React.ReactNode[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === "object" && val !== null) {
        rows.push(...renderTableRows(val, depth + 1));
      } else {
        rows.push(
          <React.Fragment key={key}>
            <div className="text-gray-500 font-medium bg-gray-50 px-2 py-1.5 rounded-lg">{formatSummaryKey(key)}</div>
            <div className="text-gray-800 font-semibold bg-white px-2 py-1.5 rounded-lg border border-gray-50">{String(val)}</div>
          </React.Fragment>
        );
      }
    }
    return rows;
  }

  function formatSummaryKey(key: string): string {
    const map: Record<string, string> = {
      khang_dinh: "Khẳng định",
      phu_dinh: "Phủ định",
      cau_hoi: "Câu hỏi",
      tra_loi_hai: "Trả lời はい",
      tra_loi_iie: "Trả lời いいえ",
      hien_tai_tuong_lai: "Hiện tại / Tương lai",
      qua_khu: "Quá khứ",
      danh_tu: "Danh từ",
      dong_tu: "Động từ",
    };
    return map[key] || key.replace(/_/g, " ");
  }
}
