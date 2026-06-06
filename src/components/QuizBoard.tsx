import React, { useState, useMemo } from "react";
import { QuizQuestion } from "../types";
import { kanaToRomaji } from "../utils/kanaToRomaji";
import { CheckCircle2, XCircle, Award, RefreshCw, Layers, Clock, BookOpen, Play, ChevronRight, Home } from "lucide-react";

interface QuizBoardProps {
  quizQuestions: QuizQuestion[];
  onQuizComplete: (score: number, total: number) => void;
}

type Phase = "setup" | "running" | "result";

export default function QuizBoard({ quizQuestions, onQuizComplete }: QuizBoardProps) {
  // Phase
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup choices
  const [setupType, setSetupType] = useState<"vocabulary" | "grammar" | "kanji" | "all">("vocabulary");
  const [setupLesson, setSetupLesson] = useState<number>(0); // 0 = all lessons
  const [setupCount, setSetupCount] = useState<number>(10);

  // Running state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ q: QuizQuestion; selected: number; correct: boolean }[]>([]);

  // History
  const [showHistory, setShowHistory] = useState(false);

  // Extract lessons
  const lessons = useMemo(() => {
    const set = new Set(quizQuestions.map(q => q.lesson || 0).filter(l => l > 0));
    return Array.from(set).sort((a, b) => a - b);
  }, [quizQuestions]);

  // Count questions per lesson/type
  const countFor = (type: string, lesson: number) => {
    let qs = quizQuestions;
    if (type !== "all") qs = qs.filter(q => q.type === type);
    if (lesson > 0) qs = qs.filter(q => (q.lesson || 0) === lesson);
    return qs.length;
  };

  // Start quiz
  const startQuiz = () => {
    let qs = quizQuestions;
    if (setupType !== "all") qs = qs.filter(q => q.type === setupType);
    if (setupLesson > 0) qs = qs.filter(q => (q.lesson || 0) === setupLesson);

    // Shuffle and limit
    qs = [...qs].sort(() => Math.random() - 0.5).slice(0, setupCount);

    if (qs.length === 0) return;

    setQuestions(qs);
    setQIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setResults([]);
    setPhase("running");
  };

  const handleAnswer = (optIndex: number) => {
    if (answered) return;
    setSelected(optIndex);
    setAnswered(true);

    const q = questions[qIndex];
    const correct = optIndex === q.answerIndex;
    if (correct) setScore(s => s + 1);
    setResults(prev => [...prev, { q, selected: optIndex, correct }]);
  };

  const handleNext = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      // Finish
      const finalScore = score;
      const total = questions.length;
      onQuizComplete(finalScore, total);

      // Save history
      const entry = {
        id: `hist-${Date.now()}`,
        date: new Date().toLocaleString("vi-VN"),
        score: finalScore,
        total,
        percent: Math.round((finalScore / total) * 100),
        filter: setupLesson > 0 ? `Bài ${setupLesson} - ${setupType === "all" ? "Tất cả" : setupType === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}` : `${setupType === "all" ? "Tất cả" : setupType === "vocabulary" ? "Từ vựng" : "Ngữ pháp"} - Tổng hợp`,
        questionCount: total,
      };
      const existing = JSON.parse(localStorage.getItem("n5_quiz_history") || "[]");
      localStorage.setItem("n5_quiz_history", JSON.stringify([entry, ...existing]));

      setPhase("result");
    }
  };

  const goHome = () => {
    setPhase("setup");
    setSelected(null);
    setAnswered(false);
  };

  // History
  const history = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("n5_quiz_history") || "[]"); }
    catch { return []; }
  }, [phase, showHistory]);

  // Current question
  const current = questions[qIndex];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* ====== SETUP PHASE ====== */}
      {phase === "setup" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Trắc nghiệm ôn tập</h2>
              <p className="text-sm text-gray-500 mt-1">{quizQuestions.length} câu hỏi sẵn sàng • Chọn bài & bắt đầu</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                showHistory ? "bg-stone-900 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
            >
              <Clock size={12} />
              Lịch sử ({history.length})
            </button>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3 animate-fade">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Lịch sử làm bài</h3>
              {history.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có bài làm nào.</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {history.map((h: any, i: number) => (
                    <div key={h.id || i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{h.filter} — {h.questionCount} câu</p>
                        <p className="text-[10px] text-gray-400 font-mono">{h.date}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${h.percent >= 80 ? "text-emerald-600" : h.percent >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                          {h.percent}%
                        </span>
                        <p className="text-[10px] text-gray-400">{h.score}/{h.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Choose Type */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">1️⃣ Chọn loại câu hỏi</h3>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "vocabulary", label: "📝 Từ vựng", emoji: "📝" },
                { key: "grammar", label: "📖 Ngữ pháp", emoji: "📖" },
                { key: "all", label: "🎯 Tổng hợp", emoji: "🎯" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSetupType(key as any)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all border-2 ${
                    setupType === key
                      ? "bg-amber-50 border-amber-400 text-amber-800 shadow-xs"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-[10px] text-gray-400 font-mono">({countFor(key, setupLesson)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose Lesson */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">2️⃣ Chọn bài học</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSetupLesson(0)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border-2 ${
                  setupLesson === 0
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                🎲 Lộn xộn (tất cả bài)
              </button>
              {lessons.map(l => (
                <button
                  key={l}
                  onClick={() => setSetupLesson(l)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border-2 ${
                    setupLesson === l
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Bài {l}
                  <span className="ml-1 text-[10px] opacity-60">({countFor(setupType, l)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Number of Questions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">3️⃣ Số câu hỏi</h3>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 30].map(n => {
                const max = countFor(setupType, setupLesson);
                if (n > max && n !== 10) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setSetupCount(n)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${
                      setupCount === n
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {n} câu
                  </button>
                );
              })}
              <button
                onClick={() => setSetupCount(999)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${
                  setupCount === 999
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Tất cả ({countFor(setupType, setupLesson)})
              </button>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={startQuiz}
              disabled={countFor(setupType, setupLesson) === 0}
              className="w-full py-4 rounded-xl text-base font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Bắt đầu ôn tập • {Math.min(setupCount, countFor(setupType, setupLesson))} câu
              {setupLesson > 0 ? ` • Bài ${setupLesson}` : " • Lộn xộn"}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ====== RUNNING PHASE ====== */}
      {phase === "running" && current && (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Top bar */}
          <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
            <button onClick={goHome} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
              <Home size={12} /> Thoát
            </button>
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} />
              {setupLesson > 0 ? `Bài ${setupLesson}` : "Lộn xộn"} • {setupType === "all" ? "Tổng hợp" : setupType === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}
            </span>
            <span>Đúng: <span className="text-emerald-600 font-bold">{score}</span>/{qIndex + 1}</span>
          </div>

          {/* Progress */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="text-center text-[10px] text-gray-300 font-mono">Câu {qIndex + 1} / {questions.length}</div>

          {/* Question */}
          <div className="bg-stone-50/50 p-5 rounded-2xl border border-gray-100 text-center">
            <p className="text-lg font-bold text-gray-800 leading-relaxed">{current.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {current.options.map((opt, idx) => {
              const isSel = selected === idx;
              const isCor = idx === current.answerIndex;
              let style = "border-gray-200 hover:border-amber-300 hover:bg-gray-50 bg-white text-gray-800";
              let icon = null;

              if (answered) {
                if (isCor) {
                  style = "border-emerald-300 bg-emerald-50/50 text-emerald-900 font-bold";
                  icon = <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />;
                } else if (isSel && !isCor) {
                  style = "border-rose-300 bg-rose-50/50 text-rose-900 font-bold";
                  icon = <XCircle size={16} className="text-rose-600 shrink-0" />;
                } else {
                  style = "border-gray-100 bg-gray-50 opacity-50 text-gray-400";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={answered}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center justify-between gap-3 ${style}`}
                >
                  <span className="flex-1">{opt}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Romaji of correct answer */}
          {answered && (
            <div className="text-center text-sm text-gray-500 font-mono animate-fade">
              🗣 {current.options[current.answerIndex]} → <span className="text-amber-700 font-semibold">{kanaToRomaji(current.options[current.answerIndex])}</span>
            </div>
          )}

          {/* Explanation */}
          {answered && current.explanation && (
            <div className="bg-amber-50/30 rounded-2xl border border-amber-100/70 p-4 animate-fade">
              <span className="text-xs font-bold text-amber-800 block font-mono uppercase tracking-widest mb-1">Lời giải</span>
              <p className="text-xs text-gray-700 leading-relaxed">{current.explanation}</p>
            </div>
          )}

          {/* Next */}
          {answered && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleNext}
                className="px-6 py-3 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {qIndex + 1 < questions.length ? "Câu tiếp ▶" : "Xem kết quả 🏁"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====== RESULT PHASE ====== */}
      {phase === "result" && (
        <div className="max-w-lg mx-auto space-y-6 animate-fade">
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-500">
              <Award size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {score === questions.length ? "🎉 Hoàn hảo!" :
               score >= questions.length * 0.8 ? "🌟 Rất tốt!" :
               score >= questions.length * 0.5 ? "💪 Khá tốt!" :
               "📚 Cần ôn thêm!"}
            </h3>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block">
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider font-mono">Kết quả</span>
              <span className="text-5xl font-black text-amber-700 block mt-1">{score} / {questions.length}</span>
              <span className="text-xs text-gray-500 mt-1 block">
                {Math.round((score / questions.length) * 100)}% chính xác
              </span>
            </div>
          </div>

          {/* Review wrong answers */}
          {results.filter(r => !r.correct).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <XCircle size={12} /> Cần ôn lại ({results.filter(r => !r.correct).length} câu sai)
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {results.filter(r => !r.correct).map((r, i) => (
                  <div key={i} className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs space-y-1.5">
                    <p className="font-semibold text-gray-800">{r.q.question}</p>
                    <p className="text-rose-600">Bạn chọn: {r.q.options[r.selected]}</p>
                    <p className="text-emerald-700">Đáp án đúng: {r.q.options[r.q.answerIndex]} <span className="text-gray-400 font-mono">({kanaToRomaji(r.q.options[r.q.answerIndex])})</span></p>
                    {r.q.explanation && <p className="text-gray-500 mt-1">{r.q.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={goHome}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Chọn bài khác
            </button>
            <button
              onClick={() => {
                setPhase("setup");
                setSelected(null);
                setAnswered(false);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Làm lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
