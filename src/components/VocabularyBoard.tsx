import React, { useState, useMemo, useEffect, useCallback } from "react";
import { VocabularyItem } from "../types";
import { speakJapanese } from "../utils/audio";
import { supabase } from "../lib/supabase";
import { Search, Volume2, Star, Grid, List as ListIcon, BookOpen, Layers, Brain, RotateCcw, BarChart3, Target } from "lucide-react";
import { getRomaji, kanaToRomaji } from "../utils/kanaToRomaji";

interface VocabularyBoardProps {
  vocabularyList: VocabularyItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onPractice?: () => void;
}

type StudyFilter = "today" | "all" | "due" | "new" | "lesson";
type StudyRating = "again" | "hard" | "good" | "easy";

interface VocabProgress {
  box: number;
  next_review: string;
  last_reviewed?: string;
  correct_streak: number;
  total_reviews: number;
  total_correct: number;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function VocabularyBoard({
  vocabularyList,
  favorites,
  toggleFavorite,
  onPractice,
}: VocabularyBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "flashcards" | "study">("list");
  const [showReadings, setShowReadings] = useState(true);

  // Study mode states
  const [studyFilter, setStudyFilter] = useState<StudyFilter>("today");
  const [studyLesson, setStudyLesson] = useState<number>(0);
  const [studyCards, setStudyCards] = useState<VocabularyItem[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyFlipped, setStudyFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });
  const [vocabProgress, setVocabProgress] = useState<Record<string, VocabProgress>>({});

  // Load vocab study progress from Supabase
  const loadProgress = useCallback(async () => {
    let local: Record<string, VocabProgress> = {};
    try { local = JSON.parse(localStorage.getItem("n5_vocab_progress") || "{}"); } catch { /* keep empty */ }
    setVocabProgress(local);
    const { data } = await supabase.from("vocab_study").select("*");
    if (data) {
      const map: Record<string, VocabProgress> = { ...local };
      for (const row of data) map[row.vocab_id] = row;
      setVocabProgress(map);
      localStorage.setItem("n5_vocab_progress", JSON.stringify(map));
    }
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  // Spaced repetition: intervals per box level (days)
  const BOX_INTERVALS = [0, 1, 3, 7, 14, 30];

  const updateWordProgress = async (vocabId: string, rating: StudyRating) => {
    const existing = vocabProgress[vocabId];
    let newBox: number, newStreak: number, newCorrect: number, newTotal: number;
    const remembered = rating !== "again";

    if (existing) {
      newTotal = (existing.total_reviews || 0) + 1;
      newCorrect = (existing.total_correct || 0) + (remembered ? 1 : 0);
      newStreak = remembered ? (existing.correct_streak || 0) + 1 : 0;
      if (rating === "again") newBox = Math.max((existing.box || 0) - 1, 0);
      else if (rating === "hard") newBox = Math.max(existing.box || 0, 1);
      else if (rating === "easy") newBox = Math.min((existing.box || 0) + 2, 5);
      else newBox = Math.min((existing.box || 0) + 1, 5);
    } else {
      newTotal = 1;
      newCorrect = remembered ? 1 : 0;
      newStreak = remembered ? 1 : 0;
      newBox = rating === "easy" ? 2 : remembered ? 1 : 0;
    }

    const nextReview = new Date();
    const interval = rating === "hard" ? Math.max(1, Math.floor(BOX_INTERVALS[newBox] / 2)) : BOX_INTERVALS[newBox];
    nextReview.setDate(nextReview.getDate() + interval);
    const nextReviewDate = localDateKey(nextReview);
    const nextProgress: VocabProgress = {
      box: newBox,
      next_review: nextReviewDate,
      last_reviewed: new Date().toISOString(),
      correct_streak: newStreak,
      total_reviews: newTotal,
      total_correct: newCorrect,
    };

    const optimistic = { ...vocabProgress, [vocabId]: nextProgress };
    setVocabProgress(optimistic);
    localStorage.setItem("n5_vocab_progress", JSON.stringify(optimistic));

    await supabase.from("vocab_study").upsert({
      vocab_id: vocabId,
      box: newBox,
      next_review: nextReviewDate,
      last_reviewed: nextProgress.last_reviewed,
      correct_streak: newStreak,
      total_reviews: newTotal,
      total_correct: newCorrect,
      updated_at: new Date().toISOString(),
    });
  };
  
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
      const term = searchTerm.toLowerCase();
      const romajiConverted = kanaToRomaji(item.reading);
      const matchesSearch =
        term === "" ||
        item.word.toLowerCase().includes(term) ||           // kanji / hiragana
        item.reading.toLowerCase().includes(term) ||        // hiragana reading
        romajiConverted.toLowerCase().includes(term) ||     // romaji (auto-converted)
        (item.romaji && item.romaji.toLowerCase().includes(term)) || // romaji (stored)
        item.meaning.toLowerCase().includes(term);          // nghĩa tiếng Việt
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
    <div className="learning-board bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <span className="eyebrow">Từ điển cá nhân</span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">Từ vựng N5</h2>
          <p className="text-sm text-gray-500 mt-1">Tra cứu khi cần, nhưng hãy dùng Ôn cách quãng để thực sự ghi nhớ.</p>
        </div>

        {/* View Mode Switcher & Show Readings Toggle */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {onPractice && <button onClick={onPractice} className="board-practice-button"><Target size={14} /> Kiểm tra từ vựng</button>}
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
            <button
              onClick={() => { setViewMode("study"); startStudySession("today"); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "study"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Brain size={14} />
              Ôn cách quãng
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
            placeholder="Tìm theo từ vựng, cách đọc (romaji), hoặc nghĩa tiếng Việt..."
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
            <>
            <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100/40 border-b border-gray-100 text-gray-600 font-medium text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12"></th>
                    <th className="py-3.5 px-4">Từ vựng</th>
                    {showReadings && <th className="py-3.5 px-4">Cách đọc (Romaji)</th>}
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
                            {item.reading !== item.word && (
                              <span className="text-gray-800 font-medium">{item.reading}</span>
                            )}
                            <span className="text-xs text-gray-400 font-mono tracking-wider">
                              {getRomaji(item.reading, item.romaji)}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Meaning & Examples */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <span className="font-medium text-gray-800">{item.meaning}</span>
                        {item.examples && item.examples.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {item.examples.map((ex, idx) => (
                              <div key={idx} className="text-xs bg-gray-50/80 p-2 rounded-lg border border-gray-100/80 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-gray-800">{ex.japanese}</span>
                                  {ex.reading && (
                                    <span className="text-gray-500 font-mono text-[11px]">
                                      ({ex.reading}{kanaToRomaji(ex.reading) ? ` • ${kanaToRomaji(ex.reading)}` : ""})
                                    </span>
                                  )}
                                  <button
                                    onClick={() => speakJapanese(ex.japanese)}
                                    className="p-0.5 text-gray-400 hover:text-amber-700 transition-colors ml-auto"
                                    title="Nghe ví dụ"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                </div>
                                {ex.meaning && <p className="text-gray-600 text-[11px]">{ex.meaning}</p>}
                              </div>
                            ))}
                          </div>
                        )}
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
            <div className="md:hidden space-y-2">
              {filteredVocabulary.map((item) => (
                <article key={item.id} className="mobile-vocab-card">
                  <button onClick={() => toggleFavorite(item.id)} aria-label="Đánh dấu từ yêu thích" className={favorites.includes(item.id) ? "favorite" : ""}>
                    <Star size={15} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                  </button>
                  <div>
                    <strong>{item.word}</strong>
                    {showReadings && <span>{item.reading} · {getRomaji(item.reading, item.romaji)}</span>}
                    <p>{item.meaning}</p>
                    {item.examples && item.examples.length > 0 && (
                      <div className="mt-1.5 space-y-1 text-xs">
                        {item.examples.map((ex, idx) => (
                          <div key={idx} className="bg-gray-50/90 p-1.5 rounded text-[11px] text-gray-600">
                            <div><strong>{ex.japanese}</strong> ({ex.reading} • {kanaToRomaji(ex.reading)})</div>
                            <div>{ex.meaning}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => speakJapanese(item.word)} aria-label={`Nghe ${item.word}`}><Volume2 size={16} /></button>
                </article>
              ))}
            </div>
            </>
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
                        {getRomaji(filteredVocabulary[currentCardIndex].reading, filteredVocabulary[currentCardIndex].romaji)}
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

      {/* ==================== Study Mode (Spaced Repetition) ==================== */}
      {viewMode === "study" && (
        <div className="space-y-6">
          {/* Study Filter Controls */}
          <div className="flex flex-wrap gap-2 items-center">
            {([
              { key: "today", label: "Hôm nay" },
              { key: "all", label: "🎯 Tất cả" },
              { key: "due", label: "⏰ Cần ôn hôm nay" },
              { key: "new", label: "🆕 Từ mới" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => startStudySession(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  studyFilter === key ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}

            {/* Lesson filter */}
            {(() => {
              const lessons = [...new Set(vocabularyList.map(v => v.lesson || 0).filter(l => l > 0))].sort((a, b) => a - b);
              return lessons.map(l => (
                <button
                  key={l}
                  onClick={() => startStudySession("lesson", l)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    studyFilter === "lesson" && studyLesson === l ? "bg-stone-900 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Bài {l}
                </button>
              ));
            })()}

            <button
              onClick={() => startStudySession(studyFilter, studyLesson)}
              className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Xáo trộn lại
            </button>
          </div>

          {/* Progress Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Từ mới", count: vocabularyList.filter(v => !vocabProgress[v.id]).length, color: "text-blue-600 bg-blue-50" },
              { label: "Hộp 1 (1 ngày)", count: (Object.values(vocabProgress) as VocabProgress[]).filter((v) => v.box === 1).length, color: "text-amber-600 bg-amber-50" },
              { label: "Hộp 2 (3 ngày)", count: (Object.values(vocabProgress) as VocabProgress[]).filter((v) => v.box === 2).length, color: "text-orange-600 bg-orange-50" },
              { label: "Hộp 3-4 (1-2 tuần)", count: (Object.values(vocabProgress) as VocabProgress[]).filter((v) => v.box === 3 || v.box === 4).length, color: "text-emerald-600 bg-emerald-50" },
              { label: "Đã thuộc (Box 5)", count: (Object.values(vocabProgress) as VocabProgress[]).filter((v) => v.box === 5).length, color: "text-green-600 bg-green-50" },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-xl border border-gray-100 ${s.color}`}>
                <span className="text-[10px] font-bold block opacity-70">{s.label}</span>
                <span className="text-xl font-black">{s.count}</span>
              </div>
            ))}
          </div>

          {studyCards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Brain className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Không có từ nào cần ôn cho bộ lọc này.</p>
              <p className="text-xs text-gray-400 mt-1">Thử đổi bộ lọc hoặc chọn “Tất cả” để ôn toàn bộ.</p>
            </div>
          ) : studyIndex >= studyCards.length ? (
            /* Study Complete */
            <div className="max-w-md mx-auto text-center py-8 space-y-6 animate-fade">
              <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-500">
                <BarChart3 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Hoàn thành phiên ôn tập!</h3>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block px-12">
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider font-mono">Kết quả</span>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <span className="text-emerald-600 text-3xl font-black">✓ {studyStats.good + studyStats.easy}</span>
                  <span className="text-rose-600 text-3xl font-black">↻ {studyStats.again + studyStats.hard}</span>
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                  {studyStats.total} từ • {Math.round(((studyStats.good + studyStats.easy) / studyStats.total) * 100)}% nhớ chắc
                </span>
              </div>
              <button
                onClick={() => startStudySession(studyFilter, studyLesson)}
                className="flex items-center gap-2 px-5 py-2.5 mx-auto text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md"
              >
                <RotateCcw size={16} />
                Ôn lại
              </button>
            </div>
          ) : (
            /* Study Card */
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>
                  {studyFilter === "lesson" ? `Bài ${studyLesson}` : studyFilter === "today" ? "Phiên thông minh hôm nay" : studyFilter === "due" ? "Cần ôn hôm nay" : studyFilter === "new" ? "Từ mới" : "Tất cả"}
                </span>
                <span>Câu {studyIndex + 1} / {studyCards.length}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((studyIndex) / studyCards.length) * 100}%` }} />
              </div>

              {/* Card */}
              <div
                onClick={() => { setStudyFlipped(!studyFlipped); if (!studyFlipped) speakJapanese(studyCards[studyIndex].word); }}
                className={`relative h-64 w-full rounded-2xl border cursor-pointer shadow-md flex flex-col justify-between p-6 transition-all duration-300 select-none ${
                  studyFlipped ? "bg-amber-50/40 border-amber-300/80 ring-1 ring-amber-200" : "bg-white border-gray-200/80 hover:shadow-lg"
                }`}
              >
                {/* Box level badge */}
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    getBoxStyle(vocabProgress[studyCards[studyIndex]?.id]?.box || 0)
                  }`}>
                    {getBoxLabel(vocabProgress[studyCards[studyIndex]?.id]?.box || 0)}
                  </span>
                  <span className="text-[10px] text-gray-300">{studyCards[studyIndex]?.category}</span>
                </div>

                {/* Content */}
                <div className="text-center flex-1 flex flex-col justify-center">
                  {!studyFlipped ? (
                    <div className="space-y-2">
                      <h3 className="text-4xl font-bold text-gray-900 tracking-tight">{studyCards[studyIndex]?.word}</h3>
                      <p className="text-xs text-gray-400 animate-pulse mt-4">Chạm để xem nghĩa ✨</p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade">
                      <div className="text-xl font-bold text-amber-700">{studyCards[studyIndex]?.reading}</div>
                      <div className="text-xs text-gray-400 font-mono">{getRomaji(studyCards[studyIndex]?.reading || "", studyCards[studyIndex]?.romaji)}</div>
                      <div className="text-lg font-semibold text-gray-800 border-t border-amber-100/60 pt-3">{studyCards[studyIndex]?.meaning}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button onClick={(e) => { e.stopPropagation(); speakJapanese(studyCards[studyIndex]?.word); }}
                    className="p-2 text-gray-400 hover:text-amber-700 hover:bg-gray-100 rounded-full transition-colors">
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-400">Đoán trước → lật thẻ → tự chấm đúng mức độ nhớ</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleStudyAnswer("again")}
                  disabled={!studyFlipped}
                  className="py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Học lại <span className="block text-[9px] opacity-60 mt-0.5">hôm nay</span>
                </button>
                <button
                  onClick={() => handleStudyAnswer("hard")}
                  disabled={!studyFlipped}
                  className="py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Khó <span className="block text-[9px] opacity-60 mt-0.5">ôn sớm</span>
                </button>
                <button
                  onClick={() => handleStudyAnswer("good")}
                  disabled={!studyFlipped}
                  className="py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Nhớ <span className="block text-[9px] opacity-60 mt-0.5">đúng lịch</span>
                </button>
                <button
                  onClick={() => handleStudyAnswer("easy")}
                  disabled={!studyFlipped}
                  className="py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Rất dễ <span className="block text-[9px] opacity-60 mt-0.5">giãn lịch</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ============================================
  // Study Mode helpers
  // ============================================

  function startStudySession(filter: StudyFilter = studyFilter, lesson = studyLesson) {
    let cards = [...vocabularyList];
    const today = localDateKey();

    if (filter === "lesson" && lesson > 0) {
      cards = cards.filter(v => (v.lesson || 0) === lesson);
    } else if (filter === "today") {
      const due = cards.filter(v => vocabProgress[v.id]?.next_review <= today);
      const fresh = cards.filter(v => !vocabProgress[v.id]).slice(0, Math.max(0, 15 - due.length));
      cards = [...due, ...fresh];
    } else if (filter === "due") {
      cards = cards.filter(v => {
        const p = vocabProgress[v.id];
        if (!p) return false; // not due if never studied
        return p.next_review <= today;
      });
    } else if (filter === "new") {
      cards = cards.filter(v => !vocabProgress[v.id]);
    }

    // Shuffle
    cards = cards.sort(() => Math.random() - 0.5).slice(0, 30); // max 30 per session

    setStudyFilter(filter);
    setStudyLesson(lesson);
    setStudyCards(cards);
    setStudyIndex(0);
    setStudyFlipped(false);
    setStudyStats({ again: 0, hard: 0, good: 0, easy: 0, total: cards.length });
  }

  function handleStudyAnswer(rating: StudyRating) {
    const card = studyCards[studyIndex];
    if (!card || !studyFlipped) return;

    updateWordProgress(card.id, rating);

    setStudyStats(prev => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));

    setStudyFlipped(false);
    setStudyIndex(prev => prev + 1);
  }

  function getBoxLabel(box: number): string {
    const labels = ["🆕 Mới", "📦 Box 1", "📦 Box 2", "📦 Box 3", "📦 Box 4", "🏆 Đã thuộc"];
    return labels[box] || "🆕 Mới";
  }

  function getBoxStyle(box: number): string {
    const styles = [
      "bg-blue-50 text-blue-600 border border-blue-200",
      "bg-amber-50 text-amber-600 border border-amber-200",
      "bg-orange-50 text-orange-600 border border-orange-200",
      "bg-yellow-50 text-yellow-700 border border-yellow-200",
      "bg-emerald-50 text-emerald-600 border border-emerald-200",
      "bg-green-50 text-green-700 border border-green-200",
    ];
    return styles[box] || styles[0];
  }
}
