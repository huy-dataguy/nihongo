import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
import {
  starterVocabulary,
  starterGrammar,
  starterKanji,
  starterQuizzes,
} from "./data/n5StarterData";
import { VocabularyItem, GrammarItem, KanjiItem, QuizQuestion, DailyImportLog, StudyProgress } from "./types";
import LearningDashboard from "./components/LearningDashboard";
import { createPracticeQuestions, mergePracticeQuestions } from "./utils/practice";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  Home,
  Layers,
  Settings2,
  Sparkles,
  Target,
} from "lucide-react";

const KanaBoard = lazy(() => import("./components/KanaBoard"));
const VocabularyBoard = lazy(() => import("./components/VocabularyBoard"));
const GrammarBoard = lazy(() => import("./components/GrammarBoard"));
const QuizBoard = lazy(() => import("./components/QuizBoard"));
const KanjiBoard = lazy(() => import("./components/KanjiBoard"));
const DailyImporter = lazy(() => import("./components/DailyImporter"));

type ActiveTab = "home" | "kana" | "vocabulary" | "kanji" | "grammar" | "practice" | "import";

const validTabs: ActiveTab[] = ["home", "kana", "vocabulary", "kanji", "grammar", "practice", "import"];

const tabLabels: Record<ActiveTab, string> = {
  home: "Hôm nay",
  kana: "Bảng chữ Kana",
  vocabulary: "Từ vựng N5",
  kanji: "Hán tự Kanji N5",
  grammar: "Ngữ pháp & Chia thể",
  practice: "Luyện tập & Phản xạ",
  import: "Dữ liệu & AI",
};

function tabFromHash(): ActiveTab {
  const hash = window.location.hash.replace("#", "");
  const candidate = hash.split(":")[0] as ActiveTab;
  return validTabs.includes(candidate) ? candidate : "home";
}

function practiceTypeFromHash(): QuizQuestion["type"] | "all" {
  const hash = window.location.hash.replace("#", "");
  const candidate = hash.split(":")[1];
  return ["vocabulary", "grammar", "kanji", "kana"].includes(candidate)
    ? (candidate as QuizQuestion["type"])
    : "all";
}

function compactCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

// Supabase pagination helper
async function fetchAllRows(table: string): Promise<any[]> {
  const pageSize = 1000;
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabFromHash);
  const [practiceType, setPracticeType] = useState<QuizQuestion["type"] | "all">(practiceTypeFromHash);

  // Main datasets
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

  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Hash & Browser history popstate sync
  useEffect(() => {
    const syncFromHash = () => {
      setActiveTab(tabFromHash());
      setPracticeType(practiceTypeFromHash());
    };

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  // Keyboard shortcut navigation (Alt + 1..7)
  useEffect(() => {
    function handleGlobalKeys(e: KeyboardEvent) {
      if (e.altKey && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const tabIndex = parseInt(e.key, 10) - 1;
        if (validTabs[tabIndex]) {
          navigate(validTabs[tabIndex]);
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [vocabRows, grammarRows, kanjiRows, quizRows, logsRes, progressRes] = await Promise.all([
        fetchAllRows("vocabulary"),
        fetchAllRows("grammar"),
        fetchAllRows("kanji"),
        fetchAllRows("quizzes"),
        supabase.from("import_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("study_progress").select("*").eq("id", 1).single(),
      ]);

      setVocabularyList(vocabRows.length ? vocabRows.map(mapVocabRow) : starterVocabulary);
      setGrammarList(grammarRows.length ? grammarRows.map(mapGrammarRow) : starterGrammar);
      setKanjiList(kanjiRows.length ? kanjiRows.map(mapKanjiRow) : starterKanji);
      setQuizQuestions(quizRows.length ? quizRows.map(mapQuizRow) : starterQuizzes);
      setImportLogs((logsRes.data || []).map(mapLogRow));

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

    setVocabularyList((prev) => [...newVocab.map(mapVocabRow), ...prev]);
    setGrammarList((prev) => [...newGrammar.map(mapGrammarRow), ...prev]);
    setKanjiList((prev) => [...newKanji.map(mapKanjiRow), ...prev]);
    setQuizQuestions((prev) => [...newQuizzes.map(mapQuizRow), ...prev]);

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

    await loadData();
  }, []);

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

  const importBackup = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);

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

        await loadData();
        alert("Đã khôi phục dữ liệu từ tệp sao lưu thành công!");
      } catch (err) {
        alert("Có lỗi xảy ra: Tệp tin sao lưu không chính xác.");
      }
    };
    reader.readAsText(file);
  }, []);

  const localQuizHistory = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("n5_quiz_history") || "[]") as Array<{ percent?: number }>;
    } catch {
      return [];
    }
  }, [studyProgress.quizScores]);

  const totalCompletedQuizzes = Math.max(Object.keys(studyProgress.quizScores).length, localQuizHistory.length);

  const averageAccuracy = useMemo(() => {
    const scores = Object.values(studyProgress.quizScores) as StudyProgress["quizScores"][string][];
    if (scores.length > 0) {
      const sum = scores.reduce((acc, current) => acc + (current.score / current.total), 0);
      return Math.round((sum / scores.length) * 100);
    }
    if (localQuizHistory.length > 0) {
      return Math.round(localQuizHistory.reduce((sum, entry) => sum + (entry.percent || 0), 0) / localQuizHistory.length);
    }
    return 0;
  }, [localQuizHistory, studyProgress.quizScores]);

  const practiceQuestions = useMemo(
    () => mergePracticeQuestions(
      quizQuestions,
      createPracticeQuestions(vocabularyList, grammarList, kanjiList),
    ),
    [quizQuestions, vocabularyList, grammarList, kanjiList],
  );

  const navigate = useCallback((destination: ActiveTab, type?: QuizQuestion["type"] | "all") => {
    if (type) setPracticeType(type);
    setActiveTab(destination);
    const nextHash = destination === "practice" && type && type !== "all" ? `#${destination}:${type}` : `#${destination}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState({ tab: destination, type }, "", nextHash);
    }
  }, []);

  const navigation = [
    { key: "home" as const, label: "Hôm nay", shortLabel: "Hôm nay", icon: Home },
    { key: "kana" as const, label: "Bảng chữ Kana", shortLabel: "Kana", icon: GraduationCap },
    { key: "vocabulary" as const, label: "Từ vựng", shortLabel: "Từ vựng", icon: BookOpen },
    { key: "kanji" as const, label: "Kanji", shortLabel: "Kanji", icon: Layers },
    { key: "grammar" as const, label: "Ngữ pháp", shortLabel: "Ngữ pháp", icon: BrainCircuit },
    { key: "practice" as const, label: "Luyện tập", shortLabel: "Luyện", icon: Target },
    { key: "import" as const, label: "Dữ liệu & AI", shortLabel: "Dữ liệu", icon: Settings2 },
  ];

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-mark">日</div>
        <div className="loading-line"><span /></div>
        <p>Đang chuẩn bị góc học của bạn...</p>
      </div>
    );
  }

  return (
    <div className="app-shell bg-[#f4f3ef] min-h-screen text-slate-900 font-sans">
      {/* Modern Glassmorphic Single Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#1e2523]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button className="brand flex items-center gap-3 cursor-pointer group" onClick={() => navigate("home")} aria-label="Về trang Hôm nay">
            <span className="brand-mark w-10 h-10 rounded-xl bg-rose-600 text-white font-bold text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              日
            </span>
            <div className="flex flex-col text-left">
              <strong className="text-white text-base font-bold tracking-tight">nihonGo</strong>
              <small className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">JLPT N5 Companion</small>
            </div>
          </button>

          {/* Desktop Navigation Link Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            {navigation.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => navigate(key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-rose-600 text-white shadow-md font-bold scale-102"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                  {key === "practice" && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {compactCount(practiceQuestions.length)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button */}
          <button
            onClick={() => navigate("practice", "all")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">Luyện nhanh 15p</span>
          </button>
        </div>

        {/* Mobile Horizontal Navigation Scrollbar */}
        <div className="md:hidden border-t border-white/10 bg-[#171d1c]/90 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
          {navigation.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-rose-600 text-white font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container with Fixed Stable Min-Height */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 min-h-[calc(100vh-140px)]">
        {activeTab === "home" && (
          <LearningDashboard
            vocabularyCount={vocabularyList.length}
            grammarCount={grammarList.length}
            kanjiCount={kanjiList.length}
            favoritesCount={favorites.length}
            completedSessions={totalCompletedQuizzes}
            averageAccuracy={averageAccuracy}
            questions={practiceQuestions}
            onNavigate={(destination, type) => navigate(destination, type)}
          />
        )}

        <Suspense
          fallback={
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 bg-white/60 rounded-3xl border border-stone-200/80 shadow-xs">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold font-mono">Đang tải bài học...</p>
            </div>
          }
        >
          {activeTab === "kana" && <KanaBoard onPractice={() => navigate("practice", "kana")} />}

          {activeTab === "vocabulary" && (
            <VocabularyBoard
              vocabularyList={vocabularyList}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onPractice={() => navigate("practice", "vocabulary")}
            />
          )}

          {activeTab === "kanji" && <KanjiBoard kanjiList={kanjiList} onPractice={() => navigate("practice", "kanji")} />}

          {activeTab === "grammar" && (
            <GrammarBoard grammarList={grammarList} onPractice={() => navigate("practice", "grammar")} />
          )}

          {activeTab === "practice" && (
            <QuizBoard
              quizQuestions={practiceQuestions}
              onQuizComplete={handleQuizComplete}
              initialType={practiceType}
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
        </Suspense>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 font-mono">
        少しずつ、毎日。 <span>nihonGo · 2026</span>
      </footer>

      {/* Mobile Glassmorphic Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-[#171d1c]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around md:hidden">
        {navigation.map(({ key, shortLabel, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? "text-rose-400 font-bold" : "text-slate-400"
              }`}
            >
              <Icon size={18} />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
