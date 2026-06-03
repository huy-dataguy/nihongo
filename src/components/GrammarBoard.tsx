import React, { useState, useMemo } from "react";
import { GrammarItem } from "../types";
import { speakJapanese } from "../utils/audio";
import { ChevronDown, ChevronUp, Volume2, BookOpen, Clock } from "lucide-react";

interface GrammarBoardProps {
  grammarList: GrammarItem[];
}

export default function GrammarBoard({ grammarList }: GrammarBoardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Extract weeks/categories
  const categories = useMemo(() => {
    const list = grammarList.map((item) => item.category || "Chưa phân loại");
    return ["all", ...Array.from(new Set(list))];
  }, [grammarList]);

  // Filter based on week selection
  const filteredGrammar = useMemo(() => {
    if (selectedCategory === "all") return grammarList;
    return grammarList.filter((item) => (item.category || "Chưa phân loại") === selectedCategory);
  }, [grammarList, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Ngữ pháp N5 ứng dụng</h2>
          <p className="text-sm text-gray-500 mt-1">Cấu trúc câu, cách chia động từ và ví dụ liên quan theo giáo trình</p>
        </div>

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
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
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
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-gray-100/60 bg-gray-50/40 rounded-b-xl space-y-4">
                    <div className="pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Giải thích cách dùng</h4>
                      <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                        {item.explanation}
                      </p>
                    </div>

                    {item.examples && item.examples.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                          <Clock size={12} />
                          Câu ví dụ ứng dụng
                        </h4>
                        
                        <div className="space-y-2.5">
                          {item.examples.map((example, i) => (
                            <div
                              key={i}
                              className="bg-white p-3 rounded-xl border border-gray-100 flex items-start justify-between gap-4 hover:border-amber-200 transition-colors group"
                            >
                              <div className="space-y-1.5">
                                <p className="text-base font-semibold text-gray-900 font-sans tracking-tight">
                                  {example.japanese}
                                </p>
                                <p className="text-xs text-gray-400 italic">[{example.reading}]</p>
                                <p className="text-sm text-gray-600">{example.meaning}</p>
                              </div>

                              <button
                                onClick={() => speakJapanese(example.japanese)}
                                className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors group-hover:text-amber-600"
                                title="Nghe cách phát âm"
                              >
                                <Volume2 size={16} />
                              </button>
                            </div>
                          ))}
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
}
