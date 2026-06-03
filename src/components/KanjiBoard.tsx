import React, { useState } from "react";
import { KanjiItem } from "../types";
import { speakJapanese } from "../utils/audio";
import { Volume2, BookOpen, Layers } from "lucide-react";

interface KanjiBoardProps {
  kanjiList: KanjiItem[];
}

export default function KanjiBoard({ kanjiList }: KanjiBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKanji, setSelectedKanji] = useState<KanjiItem | null>(null);

  // Filter Kanji list
  const filteredKanji = kanjiList.filter((item) => {
    return (
      item.character.includes(searchTerm) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.onyomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kunyomi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Học chữ Hán (Kanji N5)</h2>
          <p className="text-sm text-gray-500 mt-1">Cách đọc On, Kun, âm Hán Việt và phân tích từ ghép minh họa</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm chữ Hán, nghĩa, âm đọc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kanji Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredKanji.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedKanji(item)}
                className={`p-4 rounded-xl border text-center cursor-pointer transition-all duration-200 select-none ${
                  selectedKanji?.id === item.id
                    ? "bg-amber-50/40 border-amber-300 shadow-sm"
                    : "bg-gray-50/40 hover:bg-white border-gray-100 hover:border-amber-200 hover:shadow-xs"
                }`}
              >
                <div className="text-4xl font-semibold text-gray-800 font-sans tracking-tight mb-2">
                  {item.character}
                </div>
                <div className="text-xs font-bold text-gray-900 bg-gray-100/70 py-1 px-2 rounded-md">
                  {item.meaning.split(" ")[0]}
                </div>
                <div className="mt-2 text-[10px] text-gray-400 font-mono truncate">
                  Kun: {item.kunyomi}
                </div>
              </div>
            ))}

            {filteredKanji.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Layers className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm font-medium">Không tìm thấy chữ Hán nào trùng khớp.</p>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-150 p-5 space-y-4 shadow-inner min-h-[320px] flex flex-col justify-start">
          {selectedKanji ? (
            <div className="space-y-4">
              {/* Giant Character Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-4xl font-bold font-sans text-gray-900 shadow-xs shrink-0">
                  {selectedKanji.character}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedKanji.meaning}</h3>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Ý nghĩa chính</span>
                </div>
              </div>

              {/* Readings Block */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Cách đọc On (Onyomi)</span>
                  <p className="text-sm font-medium text-amber-900">{selectedKanji.onyomi || "Không có"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Cách đọc Kun (Kunyomi)</span>
                  <p className="text-sm font-medium text-emerald-950">{selectedKanji.kunyomi || "Không có"}</p>
                </div>
              </div>

              {/* Example Compounds */}
              <div className="border-t border-gray-100 pt-3.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono mb-2">Từ ghép tiêu biểu</span>
                
                {selectedKanji.examples && selectedKanji.examples.length > 0 ? (
                  <div className="space-y-2">
                    {selectedKanji.examples.map((ex, index) => (
                      <div
                        key={index}
                        className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3 text-xs hover:border-amber-200 transition-colors group"
                      >
                        <div>
                          <p
                            className="font-bold text-gray-800 text-sm cursor-pointer hover:text-amber-700"
                            onClick={() => speakJapanese(ex.word)}
                          >
                            {ex.word} ({ex.reading})
                          </p>
                          <p className="text-gray-500 font-medium">{ex.meaning}</p>
                        </div>
                        <button
                          onClick={() => speakJapanese(ex.word)}
                          className="p-1 px-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-md transition-colors"
                          title="Phát âm"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa có từ ghép ví dụ cho chữ này.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <BookOpen className="h-12 w-12 text-gray-300 mb-3 animate-bounce" />
              <p className="text-gray-500 font-medium text-sm">Chạm vào một chữ Hán</p>
              <p className="text-xs text-gray-400 mt-1">Để xem giải nghĩa chi tiết, chữ ghép và cách viết cụ thể.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
