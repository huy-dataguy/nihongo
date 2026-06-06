import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
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
import { BookOpen, HelpCircle, GraduationCap, Sparkles, BookCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"kana" | "vocabulary" | "grammar" | "quiz" | "import">("vocabulary");

  // Main lists loaded from Supabase
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Session state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [importLogs, setImportLogs] = useState<DailyImportLog[]>([]);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>({
    viewedKana: [],
    quizScores: {},
    favorites: [],
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [vocabRes, grammarRes, kanjiRes, quizzesRes, logsRes, progressRes] = await Promise.all([
        supabase.from("vocabulary").select("*").order("created_at", { ascending: true }),
        supabase.from("grammar").select("*").order("created_at", { ascending: true }),
        supabase.from("kanji").select("*").order("created_at", { ascending: true }),
        supabase.from("quizzes").select("*").order("created_at", { ascending: true }),
        supabase.from("import_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("study_progress").select("*").eq("id", 1).single(),
      ]);

      // Map DB rows (snake_case) → TypeScript interfaces (camelCase)
      setVocabularyList(
        (vocabRes.data || []).map(mapVocabRow)
      );
      setGrammarList(
        (grammarRes.data || []).map(mapGrammarRow)
      );
      setKanjiList(
        (kanjiRes.data || []).map(mapKanjiRow)
      );
      setQuizQuestions(
        (quizzesRes.data || []).map(mapQuizRow)
      );
      setImportLogs(
        (logsRes.data || []).map(mapLogRow)
      );

      if (progressRes.data) {
        const p = progressRes.data;
        setFavorites((p.favorites as string[]) || []);
        setStudyProgress({
          viewedKana: (p.viewed_kana as string[]) || [],
          quizScores: (p.quiz_scores as Record<string, any>) || {},
          favorites: (p.favorites as string[]) || [],
        });
      }
    } catch (err) {
      console.error("Failed to load data from Supabase, using starter data:", err);
      setVocabularyList(starterVocabulary);
      setGrammarList(starterGrammar);
      setKanjiList(starterKanji);
      setQuizQuestions(starterQuizzes);
    } finally {
      setIsLoading(false);
    }
  }

  // Row mappers: snake_case DB → camelCase TS
  function mapVocabRow(row: any): VocabularyItem {
    return {
      id: row.id,
      word: row.word,
      reading: row.reading,
      romaji: row.romaji || "",
      meaning: row.meaning,
      category: row.category || "",
      lesson: row.lesson || 0,
      examples: row.examples || [],
      isCustom: row.is_custom,
      createdAt: row.created_at,
    };
  }

  function mapGrammarRow(row: any): GrammarItem {
    return {
      id: row.id,
      structure: row.structure,
      meaning: row.meaning,
      explanation: row.explanation || "",
      notes: row.notes || "",
      category: row.category || "",
      lesson: row.lesson || 0,
      examples: row.examples || [],
      summary: row.summary || {},
      conjugationTables: row.conjugation_tables || {},
      isCustom: row.is_custom,
    };
  }

  function mapKanjiRow(row: any): KanjiItem {
    return {
      id: row.id,
      character: row.character,
      onyomi: row.onyomi || "",
      kunyomi: row.kunyomi || "",
      meaning: row.meaning,
      lesson: row.lesson || 0,
      examples: row.examples || [],
      isCustom: row.is_custom,
    };
  }

  function mapQuizRow(row: any): QuizQuestion {
    return {
      id: row.id,
      question: row.question,
      options: row.options || [],
      answerIndex: row.answer_index,
      explanation: row.explanation || "",
      type: row.type,
      lesson: row.lesson || 0,
      isCustom: row.is_custom,
    };
  }

  function mapLogRow(row: any): DailyImportLog {
    return {
      id: row.id,
      date: row.date,
      rawText: row.raw_text || "",
      parsedItemCount: row.parsed_item_count,
    };
  }

  // Toggle favorite — update Supabase
  const toggleFavorite = useCallback(async (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updated);

    await supabase.from("study_progress").upsert({
      id: 1,
      favorites: updated,
      quiz_scores: studyProgress.quizScores,
      viewed_kana: studyProgress.viewedKana,
      updated_at: new Date().toISOString(),
    });
  }, [favorites, studyProgress]);

  // Quiz complete — update Supabase
  const handleQuizComplete = useCallback(async (score: number, total: number) => {
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

    await supabase.from("study_progress").upsert({
      id: 1,
      favorites,
      quiz_scores: updatedProgress.quizScores,
      viewed_kana: updatedProgress.viewedKana,
      updated_at: new Date().toISOString(),
    });
  }, [studyProgress, favorites]);

  // AI Import — insert new data into Supabase
  const handleDataImported = useCallback(async (parsedData: any) => {
    const timestamp = Date.now();

    const newVocab = (parsedData.vocabulary || []).map((v: any, index: number) => ({
      id: `custom-v-${timestamp}-${index}`,
      word: v.word,
      reading: v.reading,
      romaji: v.romaji || "",
      meaning: v.meaning,
      category: v.category || `Nạp ngày ${new Date().toLocaleDateString("vi-VN")}`,
      examples: v.examples || [],
      is_custom: true,
    }));

    const newGrammar = (parsedData.grammar || []).map((g: any, index: number) => ({
      id: `custom-g-${timestamp}-${index}`,
      structure: g.structure,
      meaning: g.meaning,
      explanation: g.explanation || "",
      category: g.category || `Nạp ngày ${new Date().toLocaleDateString("vi-VN")}`,
      examples: g.examples || [],
      is_custom: true,
    }));

    const newKanji = (parsedData.kanjiList || []).map((k: any, index: number) => ({
      id: `custom-k-${timestamp}-${index}`,
      character: k.character,
      onyomi: k.onyomi || "",
      kunyomi: k.kunyomi || "",
      meaning: k.meaning,
      examples: k.examples || [],
      is_custom: true,
    }));

    const newQuizzes = (parsedData.quizzes || []).map((q: any, index: number) => ({
      id: `custom-q-${timestamp}-${index}`,
      question: q.question,
      options: q.options,
      answer_index: q.answerIndex,
      explanation: q.explanation || "",
      type: q.type,
      is_custom: true,
    }));

    // Insert into Supabase
    const [vocabRes, grammarRes, kanjiRes, quizRes] = await Promise.all([
      newVocab.length > 0 ? supabase.from("vocabulary").insert(newVocab) : Promise.resolve({ error: null }),
      newGrammar.length > 0 ? supabase.from("grammar").insert(newGrammar) : Promise.resolve({ error: null }),
      newKanji.length > 0 ? supabase.from("kanji").insert(newKanji) : Promise.resolve({ error: null }),
      newQuizzes.length > 0 ? supabase.from("quizzes").insert(newQuizzes) : Promise.resolve({ error: null }),
    ]);

    if (vocabRes.error || grammarRes.error || kanjiRes.error || quizRes.error) {
      console.error("Insert errors:", { vocabRes, grammarRes, kanjiRes, quizRes });
      throw new Error("Lỗi khi lưu dữ liệu vào database.");
    }

    // Update local state
    setVocabularyList((prev) => [...newVocab.map(mapVocabRow), ...prev]);
    setGrammarList((prev) => [...newGrammar.map(mapGrammarRow), ...prev]);
    setKanjiList((prev) => [...newKanji.map(mapKanjiRow), ...prev]);
    setQuizQuestions((prev) => [...newQuizzes.map(mapQuizRow), ...prev]);

    // Save import log
    const newLog = {
      id: `log-${timestamp}`,
      date: new Date().toLocaleString("vi-VN"),
      raw_text: parsedData.rawText || "",
      parsed_item_count: {
        vocabulary: newVocab.length,
        grammar: newGrammar.length,
        kanji: newKanji.length,
        quizzes: newQuizzes.length,
      },
    };

    await supabase.from("import_logs").insert(newLog);
    setImportLogs((prev) => [mapLogRow(newLog), ...prev]);
  }, []);

  // Clear all custom data — delete from Supabase, reload
  const clearAllCustomData = useCallback(async () => {
    await Promise.all([
      supabase.from("vocabulary").delete().eq("is_custom", true),
      supabase.from("grammar").delete().eq("is_custom", true),
      supabase.from("kanji").delete().eq("is_custom", true),
      supabase.from("quizzes").delete().eq("is_custom", true),
      supabase.from("import_logs").delete().neq("id", ""),
    ]);

    await supabase.from("study_progress").upsert({
      id: 1,
      favorites: [],
      quiz_scores: {},
      viewed_kana: [],
      updated_at: new Date().toISOString(),
    });

    // Reload fresh data
    await loadData();
  }, []);

  // Export backup as JSON
  const exportBackup = useCallback(() => {
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
  }, [vocabularyList, grammarList, kanjiList, quizQuestions, favorites, studyProgress, importLogs]);

  // Import backup — upsert into Supabase
  const importBackup = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);

        // Upsert all data into Supabase
        if (parsed.vocabularyList?.length) {
          const rows = parsed.vocabularyList.map((v: VocabularyItem) => ({
            id: v.id, word: v.word, reading: v.reading, romaji: v.romaji || "",
            meaning: v.meaning, category: v.category || "", examples: v.examples || [],
            is_custom: v.isCustom || false,
          }));
          await supabase.from("vocabulary").upsert(rows);
        }
        if (parsed.grammarList?.length) {
          const rows = parsed.grammarList.map((g: GrammarItem) => ({
            id: g.id, structure: g.structure, meaning: g.meaning, explanation: g.explanation || "",
            category: g.category || "", examples: g.examples || [], is_custom: g.isCustom || false,
          }));
          await supabase.from("grammar").upsert(rows);
        }
        if (parsed.kanjiList?.length) {
          const rows = parsed.kanjiList.map((k: KanjiItem) => ({
            id: k.id, character: k.character, onyomi: k.onyomi || "", kunyomi: k.kunyomi || "",
            meaning: k.meaning, examples: k.examples || [], is_custom: k.isCustom || false,
          }));
          await supabase.from("kanji").upsert(rows);
        }
        if (parsed.quizQuestions?.length) {
          const rows = parsed.quizQuestions.map((q: QuizQuestion) => ({
            id: q.id, question: q.question, options: q.options, answer_index: q.answerIndex,
            explanation: q.explanation || "", type: q.type, is_custom: q.isCustom || false,
          }));
          await supabase.from("quizzes").upsert(rows);
        }

        // Reload to get fresh data from DB
        await loadData();
        alert("Đã khôi phục dữ liệu từ tệp sao lưu thành công!");
      } catch (err) {
        alert("Có lỗi xảy ra: Tệp tin sao lưu không chính xác.");
      }
    };
    reader.readAsText(file);
  }, []);

  // Calculate statistics
  const totalCompletedQuizzes = Object.keys(studyProgress.quizScores).length;
  const averageAccuracy = useMemo(() => {
    const scores = Object.values(studyProgress.quizScores) as any[];
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc: number, current: any) => acc + (current.score / current.total), 0);
    return Math.round((sum / scores.length) * 100);
  }, [studyProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50/50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium">
        <p>Học ngoại ngữ là một quá trình kiên trì hằng ngày. Bạn đang tiến bộ hơn mỗi ngày cùng nihonGO!</p>
        <p className="mt-1 font-mono text-[10px] text-gray-300">© 2026 nihonGO! • Crafted elegantly with Gemini Intelligence</p>
      </footer>
    </div>
  );
}
