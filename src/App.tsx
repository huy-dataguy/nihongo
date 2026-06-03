import React, { useState, useEffect, useMemo } from "react";
import {
  starterVocabulary,
  starterGrammar,
  starterKanji,
  starterQuizzes,
} from "./data/n5StarterData";
import { VocabularyItem, GrammarItem, KanjiItem, QuizQuestion, DailyImportLog, StudyProgress } from "./types";
import KanaBoard from "./components/KanaBoard";
import VocabularyBoard from "./components/VocabularyBoard";
import GrammarBoard from "./components/GrammarBoard";
import QuizBoard from "./components/QuizBoard";
import DailyImporter from "./components/DailyImporter";
import { BookOpen, HelpCircle, GraduationCap, Settings, Sparkles, MessageCircle, BookCheck, Star, Award, Layers } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"kana" | "vocabulary" | "grammar" | "quiz" | "import">("vocabulary");

  // Main lists loaded from local storage or defaults
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  // Favorites and Study analytics
  const [favorites, setFavorites] = useState<string[]>([]);
  const [importLogs, setImportLogs] = useState<DailyImportLog[]>([]);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>({
    viewedKana: [],
    quizScores: {},
    favorites: [],
  });

  // Load state on mount
  useEffect(() => {
    const localVocab = localStorage.getItem("n5_vocabulary");
    const localGrammar = localStorage.getItem("n5_grammar");
    const localKanji = localStorage.getItem("n5_kanji");
    const localQuizzes = localStorage.getItem("n5_quizzes");
    const localFavs = localStorage.getItem("n5_favorites");
    const localLogs = localStorage.getItem("n5_import_logs");
    const localProgress = localStorage.getItem("n5_progress");

    setVocabularyList(localVocab ? JSON.parse(localVocab) : starterVocabulary);
    setGrammarList(localGrammar ? JSON.parse(localGrammar) : starterGrammar);
    setKanjiList(localKanji ? JSON.parse(localKanji) : starterKanji);
    setQuizQuestions(localQuizzes ? JSON.parse(localQuizzes) : starterQuizzes);
    setFavorites(localFavs ? JSON.parse(localFavs) : []);
    setImportLogs(localLogs ? JSON.parse(localLogs) : []);
    setStudyProgress(localProgress ? JSON.parse(localProgress) : {
      viewedKana: [],
      quizScores: {},
      favorites: [],
    });
  }, []);

  // Sync favorites
  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("n5_favorites", JSON.stringify(updated));
  };

  // Sync quiz completions
  const handleQuizComplete = (score: number, total: number) => {
    const quizId = `score-${Date.now()}`;
    const updatedProgress = {
      ...studyProgress,
      quizScores: {
        ...studyProgress.quizScores,
        [quizId]: {
          score,
          total,
          date: new Date().toLocaleDateString("vi-VN"),
        },
      },
    };
    setStudyProgress(updatedProgress);
    localStorage.setItem("n5_progress", JSON.stringify(updatedProgress));
  };

  // Dynamically nạp/import user parsed items
  const handleDataImported = (parsedData: any) => {
    const newVocab: VocabularyItem[] = (parsedData.vocabulary || []).map((v: any, index: number) => ({
      ...v,
      id: `custom-v-${Date.now()}-${index}`,
      isCustom: true,
      category: v.category || `Nạp ngày ${new Date().toLocaleDateString("vi-VN")}`,
      examples: v.examples || [],
    }));

    const newGrammar: GrammarItem[] = (parsedData.grammar || []).map((g: any, index: number) => ({
      ...g,
      id: `custom-g-${Date.now()}-${index}`,
      isCustom: true,
      category: g.category || `Nạp ngày ${new Date().toLocaleDateString("vi-VN")}`,
      examples: g.examples || [],
    }));

    const newKanji: KanjiItem[] = (parsedData.kanjiList || []).map((k: any, index: number) => ({
      ...k,
      id: `custom-k-${Date.now()}-${index}`,
      isCustom: true,
      examples: k.examples || [],
    }));

    const newQuizzes: QuizQuestion[] = (parsedData.quizzes || []).map((q: any, index: number) => ({
      ...q,
      id: `custom-q-${Date.now()}-${index}`,
      isCustom: true,
    }));

    const updatedVocab = [...newVocab, ...vocabularyList];
    const updatedGrammar = [...newGrammar, ...grammarList];
    const updatedKanji = [...newKanji, ...kanjiList];
    const updatedQuizzes = [...newQuizzes, ...quizQuestions];

    setVocabularyList(updatedVocab);
    setGrammarList(updatedGrammar);
    setKanjiList(updatedKanji);
    setQuizQuestions(updatedQuizzes);

    localStorage.setItem("n5_vocabulary", JSON.stringify(updatedVocab));
    localStorage.setItem("n5_grammar", JSON.stringify(updatedGrammar));
    localStorage.setItem("n5_kanji", JSON.stringify(updatedKanji));
    localStorage.setItem("n5_quizzes", JSON.stringify(updatedQuizzes));

    // Save Daily Import logs
    const newLog: DailyImportLog = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleString("vi-VN"),
      rawText: parsedData.rawText || "",
      parsedItemCount: {
        vocabulary: newVocab.length,
        grammar: newGrammar.length,
        kanji: newKanji.length,
        quizzes: newQuizzes.length,
      },
    };
    const updatedLogs = [newLog, ...importLogs];
    setImportLogs(updatedLogs);
    localStorage.setItem("n5_import_logs", JSON.stringify(updatedLogs));
  };

  // Clear all custom-imported user study cards
  const clearAllCustomData = () => {
    localStorage.removeItem("n5_vocabulary");
    localStorage.removeItem("n5_grammar");
    localStorage.removeItem("n5_kanji");
    localStorage.removeItem("n5_quizzes");
    localStorage.removeItem("n5_favorites");
    localStorage.removeItem("n5_import_logs");
    localStorage.removeItem("n5_progress");

    setVocabularyList(starterVocabulary);
    setGrammarList(starterGrammar);
    setKanjiList(starterKanji);
    setQuizQuestions(starterQuizzes);
    setFavorites([]);
    setImportLogs([]);
    setStudyProgress({
      viewedKana: [],
      quizScores: {},
      favorites: [],
    });
  };

  // Export JSON system study cards as backup file
  const exportBackup = () => {
    const backupData = {
      vocabularyList,
      grammarList,
      kanjiList,
      quizQuestions,
      favorites,
      studyProgress,
      importLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `japanese_n5_assistant_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup file
  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.vocabularyList) setVocabularyList(parsed.vocabularyList);
        if (parsed.grammarList) setGrammarList(parsed.grammarList);
        if (parsed.kanjiList) setKanjiList(parsed.kanjiList);
        if (parsed.quizQuestions) setQuizQuestions(parsed.quizQuestions);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.studyProgress) setStudyProgress(parsed.studyProgress);
        if (parsed.importLogs) setImportLogs(parsed.importLogs);

        localStorage.setItem("n5_vocabulary", JSON.stringify(parsed.vocabularyList || []));
        localStorage.setItem("n5_grammar", JSON.stringify(parsed.grammarList || []));
        localStorage.setItem("n5_kanji", JSON.stringify(parsed.kanjiList || []));
        localStorage.setItem("n5_quizzes", JSON.stringify(parsed.quizQuestions || []));
        localStorage.setItem("n5_favorites", JSON.stringify(parsed.favorites || []));
        localStorage.setItem("n5_progress", JSON.stringify(parsed.studyProgress || {}));
        localStorage.setItem("n5_import_logs", JSON.stringify(parsed.importLogs || []));

        alert("Đã khôi phục dữ liệu từ tệp sao lưu thành công!");
      } catch (err) {
        alert("Có lỗi xảy ra: Tệp tin sao lưu không chính xác.");
      }
    };
    reader.readAsText(file);
  };

  // Calculate statistics
  const totalCompletedQuizzes = Object.keys(studyProgress.quizScores).length;
  const averageAccuracy = useMemo(() => {
    const scores = Object.values(studyProgress.quizScores) as any[];
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc: number, current: any) => acc + (current.score / current.total), 0);
    return Math.round((sum / scores.length) * 100);
  }, [studyProgress]);

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans text-gray-800 antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Upper Navigation/Header Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold font-sans shadow-sm">
              N5
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5 leading-none">
                nihonGO!
              </h1>
              <span className="text-[10px] text-gray-500 font-mono">Bản học tiếng Nhật cá nhân</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">
              <Sparkles size={11} />
              AI-Support Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Application Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* N5 Progress Overview Dashboard Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">Từ vựng khả dụng</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{vocabularyList.length}</span>
              <span className="text-xs text-green-600 font-bold">từ N5</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">Ngữ pháp làm chủ</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{grammarList.length}</span>
              <span className="text-xs text-green-600 font-bold">cấu trúc</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">Chữ Hán bổ sung</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{kanjiList.length}</span>
              <span className="text-xs text-green-600 font-bold">chữ viết</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">Bài kiểm tra / Điểm số</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{totalCompletedQuizzes}</span>
              <span className="text-xs text-amber-700 font-semibold">(Độ chuẩn {averageAccuracy}%)</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="border-b border-gray-200 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("kana")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "kana"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <GraduationCap size={16} />
            Bảng chữ cái
          </button>

          <button
            onClick={() => setActiveTab("vocabulary")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "vocabulary"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <BookOpen size={16} />
            Từ vựng & Từ điển
          </button>

          <button
            onClick={() => setActiveTab("grammar")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "grammar"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <BookCheck size={16} />
            Ngữ pháp
          </button>


          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "quiz"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <HelpCircle size={16} />
            Trắc nghiệm ôn tập
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <Sparkles size={16} />
            Cập nhật hàng ngày (AI)
          </button>
        </div>

        {/* Tab Boards Dynamic Render */}
        <div className="animate-fade">
          {activeTab === "kana" && <KanaBoard kanjiList={kanjiList} />}
          
          {activeTab === "vocabulary" && (
            <VocabularyBoard
              vocabularyList={vocabularyList}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          )}

          {activeTab === "grammar" && (
            <GrammarBoard grammarList={grammarList} />
          )}

          {activeTab === "quiz" && (
            <QuizBoard
              quizQuestions={quizQuestions}
              onQuizComplete={handleQuizComplete}
            />
          )}

          {activeTab === "import" && (
            <DailyImporter
              onDataImported={handleDataImported}
              importLogs={importLogs}
              clearAllCustomData={clearAllCustomData}
              exportBackup={exportBackup}
              importBackup={importBackup}
            />
          )}
        </div>
      </main>

      {/* Humble Study Motivation Quote Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium">
        <p>Học ngoại ngữ là một quá trình kiên trì hằng ngày. Bạn đang tiến bộ hơn mỗi ngày cùng nihonGO!</p>
        <p className="mt-1 font-mono text-[10px] text-gray-300">© 2026 nihonGO! • Crafted elegantly with Gemini Intelligence</p>
      </footer>
    </div>
  );
}

