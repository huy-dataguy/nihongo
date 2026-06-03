import React, { useState, useMemo } from "react";
import { VocabularyItem } from "../types";
import { speakJapanese } from "../utils/audio";
import { Search, Volume2, Star, Grid, List as ListIcon, BookOpen, Layers } from "lucide-react";

interface VocabularyBoardProps {
  vocabularyList: VocabularyItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export default function VocabularyBoard({
  vocabularyList,
  favorites,
  toggleFavorite,
}: VocabularyBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "flashcards">("list");
  const [showReadings, setShowReadings] = useState(true);
  
  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Extract all available categories
  const categories = useMemo(() => {
    const list = vocabularyList.map((item) => item.category);
    return ["all", ...Array.from(new Set(list))];
  }, [vocabularyList]);

  // Filter list based on search and category
  const filteredVocabulary = useMemo(() => {
    return vocabularyList.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        searchTerm === "" ||
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.romaji.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [vocabularyList, selectedCategory, searchTerm]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredVocabulary.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredVocabulary.length) % filteredVocabulary.length);
    }, 150);
  };

  // Reset card index if dataset changes
  React.useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Từ vựng & Từ điển N5</h2>
          <p className="text-sm text-gray-500 mt-1">Từ vựng thiết yếu xếp theo tuần và chủ đề có kèm âm thanh</p>
        </div>

        {/* View Mode Switcher & Show Readings Toggle */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {viewMode === "list" && (
            <button
              onClick={() => setShowReadings(!showReadings)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showReadings ? "Ẩn cách đọc" : "Hiện cách đọc"}
            </button>
          )}

          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ListIcon size={14} />
              Danh sách
            </button>
            <button
              onClick={() => setViewMode("flashcards")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "flashcards"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Grid size={14} />
              Flashcards
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tra cứu bằng Kanji, Hiragana, Romaji hoặc Tiếng Việt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-xl border border-gray-200 focus:border-amber-300 focus:outline-none transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-2 relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 rounded-xl border border-gray-200 focus:border-amber-300 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">📁 Tất cả chủ đề ({vocabularyList.length} từ)</option>
            {categories.filter(c => c !== "all").map((cat) => (
              <option key={cat} value={cat}>
                🏷️ {cat} ({vocabularyList.filter(item => item.category === cat).length} từ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vocabulary List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredVocabulary.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy từ vựng nào khớp với tìm kiếm.</p>
              <p className="text-xs text-gray-400 mt-1">Hãy nhập từ khác hoặc thêm từ vựng mới bằng công cụ Import bài học.</p>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100/40 border-b border-gray-100 text-gray-600 font-medium text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12"></th>
                    <th className="py-3.5 px-4">Từ vựng</th>
                    {showReadings && <th className="py-3.5 px-4">Cách đọc / Phụ âm</th>}
                    <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
                    <th className="py-3.5 px-4 w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVocabulary.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/20 transition-colors group"
                    >
                      {/* Favorite star */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-1 rounded-md transition-colors ${
                            favorites.includes(item.id)
                              ? "text-amber-500"
                              : "text-gray-300 hover:text-amber-500"
                          }`}
                        >
                          <Star size={15} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                        </button>
                      </td>

                      {/* Word */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900 font-sans">
                            {item.word}
                          </span>
                          {item.isCustom && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-100">
                              Cá nhân
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hiragana & Romaji */}
                      {showReadings && (
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-gray-800 font-medium">{item.reading}</span>
                            <span className="text-xs text-gray-400 font-mono tracking-wider">{item.romaji}</span>
                          </div>
                        </td>
                      )}

                      {/* Meaning */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <span className="font-medium text-gray-800">{item.meaning}</span>
                      </td>

                      {/* TTS Speak Word */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => speakJapanese(item.word)}
                          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Nghe cách đọc"
                        >
                          <Volume2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Flashcard View */}
      {viewMode === "flashcards" && (
        <div className="space-y-6">
          {filteredVocabulary.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy từ nào để ôn tập Flashcards.</p>
              <p className="text-xs text-gray-400 mt-1">Hãy mở rộng tìm kiếm hoặc thêm từ để học nhé.</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center text-xs text-gray-400 mb-2 font-mono">
                Từ số {currentCardIndex + 1} / {filteredVocabulary.length} trong bộ lọc
              </div>

              {/* Main Card */}
              <div
                onClick={() => {
                  setIsFlipped(!isFlipped);
                  if (!isFlipped) {
                    speakJapanese(filteredVocabulary[currentCardIndex].word);
                  }
                }}
                className={`relative h-64 w-full rounded-2xl border border-gray-200/80 cursor-pointer shadow-md flex flex-col justify-between p-6 transition-all duration-350 ease-out select-none ${
                  isFlipped 
                    ? "bg-amber-50/40 border-amber-300/80 shadow-md ring-1 ring-amber-200" 
                    : "bg-white hover:border-amber-200 hover:shadow-lg"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {filteredVocabulary[currentCardIndex].category}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(filteredVocabulary[currentCardIndex].id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors hover:bg-gray-50 ${
                      favorites.includes(filteredVocabulary[currentCardIndex].id)
                        ? "text-amber-500"
                        : "text-gray-300 hover:text-amber-500"
                    }`}
                  >
                    <Star size={16} fill={favorites.includes(filteredVocabulary[currentCardIndex].id) ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Content Center */}
                <div className="text-center flex-1 flex flex-col justify-center">
                  {!isFlipped ? (
                    <div className="space-y-2">
                      <h3 className="text-4xl font-bold text-gray-900 font-sans tracking-tight">
                        {filteredVocabulary[currentCardIndex].word}
                      </h3>
                      <p className="text-xs text-gray-400 animate-pulse mt-4">Chạm để lật và nghe phát âm ✨</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xl font-bold text-amber-700 animate-fade">
                        {filteredVocabulary[currentCardIndex].reading}
                      </div>
                      <div className="text-xs text-gray-400 font-mono tracking-wider">
                        {filteredVocabulary[currentCardIndex].romaji}
                      </div>
                      <div className="text-lg font-semibold text-gray-800 border-t border-amber-100/60 pt-3 inline-block px-6">
                        {filteredVocabulary[currentCardIndex].meaning}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer button */}
                <div className="flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakJapanese(filteredVocabulary[currentCardIndex].word);
                    }}
                    className="p-2 text-gray-400 hover:text-amber-700 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                    title="Phát âm"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-6 px-2">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-xs"
                >
                  ◀ Từ trước
                </button>
                
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-xs text-gray-500 font-medium hover:text-gray-800 underline underline-offset-4 decoration-dotted"
                >
                  {isFlipped ? "Đóng xem Kanji" : "Xem nghĩa tiếng Việt"}
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-xs"
                >
                  Từ sau ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
