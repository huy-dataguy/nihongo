import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  GraduationCap,
  History,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { QuizQuestion } from "../types";
import { kanaToRomaji } from "../utils/kanaToRomaji";

interface QuizBoardProps {
  quizQuestions: QuizQuestion[];
  onQuizComplete: (score: number, total: number) => void;
  initialType?: QuizQuestion["type"] | "all";
}

type Phase = "setup" | "running" | "result";
type SetupType = QuizQuestion["type"] | "all";
type QuizResult = { q: QuizQuestion; selected: number; correct: boolean };

interface HistoryEntry {
  id: string;
  date: string;
  score: number;
  total: number;
  percent: number;
  filter: string;
  duration: number;
  mistakeIds: string[];
}

const TYPE_META: Record<SetupType, { label: string; description: string; icon: typeof BookOpen; accent: string }> = {
  all: { label: "Tổng hợp", description: "Trộn đều mọi kỹ năng", icon: Sparkles, accent: "mixed" },
  vocabulary: { label: "Từ vựng", description: "Nghĩa, mặt chữ và cách đọc", icon: BookOpen, accent: "coral" },
  grammar: { label: "Ngữ pháp", description: "Cấu trúc và cách dùng", icon: BrainCircuit, accent: "indigo" },
  kanji: { label: "Kanji", description: "Âm đọc và ý nghĩa", icon: Layers, accent: "mint" },
  kana: { label: "Kana", description: "Nhận diện Hiragana · Katakana", icon: GraduationCap, accent: "sand" },
};

function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("n5_quiz_history") || "[]");
  } catch {
    return [];
  }
}

function readMistakes(): string[] {
  try {
    return JSON.parse(localStorage.getItem("n5_mistake_ids") || "[]");
  } catch {
    return [];
  }
}

function shuffled<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function typeLabel(type: SetupType) {
  return TYPE_META[type].label;
}

function hasJapanese(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}

export default function QuizBoard({ quizQuestions, onQuizComplete, initialType = "all" }: QuizBoardProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupType, setSetupType] = useState<SetupType>(initialType);
  const [setupLesson, setSetupLesson] = useState(0);
  const [setupCount, setSetupCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(readHistory);
  const [mistakeIds, setMistakeIds] = useState<string[]>(readMistakes);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reviewingMistakes, setReviewingMistakes] = useState(false);

  useEffect(() => {
    if (phase === "setup") {
      setSetupType(initialType);
      setSetupLesson(0);
    }
  }, [initialType, phase]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, startedAt]);

  const lessons = useMemo(() => {
    const available = quizQuestions
      .filter((question) => setupType === "all" || question.type === setupType)
      .map((question) => question.lesson || 0)
      .filter((lesson) => lesson > 0);
    return Array.from(new Set(available)).sort((a, b) => a - b);
  }, [quizQuestions, setupType]);

  useEffect(() => {
    if (setupLesson > 0 && !lessons.includes(setupLesson)) setSetupLesson(0);
  }, [lessons, setupLesson]);

  const pool = useMemo(() => quizQuestions.filter((question) => {
    if (setupType !== "all" && question.type !== setupType) return false;
    if (setupLesson > 0 && (question.lesson || 0) !== setupLesson) return false;
    return true;
  }), [quizQuestions, setupType, setupLesson]);

  const mistakePool = useMemo(() => {
    const ids = new Set(mistakeIds);
    return quizQuestions.filter((question) => ids.has(question.id));
  }, [quizQuestions, mistakeIds]);

  const current = questions[questionIndex];
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const wrongResults = results.filter((result) => !result.correct);

  const startQuiz = useCallback((mistakesOnly = false) => {
    const source = mistakesOnly ? mistakePool : pool;
    if (!source.length) return;
    const nextQuestions = shuffled(source).slice(0, mistakesOnly ? Math.min(20, source.length) : Math.min(setupCount, source.length));
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setResults([]);
    setElapsed(0);
    setStartedAt(Date.now());
    setReviewingMistakes(mistakesOnly);
    setPhase("running");
  }, [mistakePool, pool, setupCount]);

  const answer = useCallback((optionIndex: number) => {
    if (answered || !current) return;
    const correct = optionIndex === current.answerIndex;
    setSelected(optionIndex);
    setAnswered(true);
    if (correct) setScore((value) => value + 1);
    setResults((value) => [...value, { q: current, selected: optionIndex, correct }]);
  }, [answered, current]);

  const finish = useCallback(() => {
    const total = questions.length;
    const finalMistakes = results.filter((result) => !result.correct).map((result) => result.q.id);
    const answeredCorrectly = new Set(results.filter((result) => result.correct).map((result) => result.q.id));
    const updatedMistakes = Array.from(new Set([
      ...mistakeIds.filter((id) => !answeredCorrectly.has(id)),
      ...finalMistakes,
    ])).slice(0, 200);

    const entry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      date: new Date().toLocaleString("vi-VN"),
      score,
      total,
      percent: Math.round((score / total) * 100),
      filter: reviewingMistakes ? "Ôn lại câu sai" : `${typeLabel(setupType)}${setupLesson > 0 ? ` · Bài ${setupLesson}` : " · Tổng hợp"}`,
      duration: elapsed,
      mistakeIds: finalMistakes,
    };
    const updatedHistory = [entry, ...history].slice(0, 50);
    localStorage.setItem("n5_quiz_history", JSON.stringify(updatedHistory));
    localStorage.setItem("n5_mistake_ids", JSON.stringify(updatedMistakes));
    setHistory(updatedHistory);
    setMistakeIds(updatedMistakes);
    onQuizComplete(score, total);
    setPhase("result");
  }, [elapsed, history, mistakeIds, onQuizComplete, questions.length, results, reviewingMistakes, score, setupLesson, setupType]);

  const nextQuestion = useCallback(() => {
    if (!answered) return;
    if (questionIndex + 1 >= questions.length) {
      finish();
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelected(null);
    setAnswered(false);
  }, [answered, finish, questionIndex, questions.length]);

  useEffect(() => {
    if (phase !== "running") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!answered && ["1", "2", "3", "4"].includes(event.key)) answer(Number(event.key) - 1);
      if (answered && event.key === "Enter") nextQuestion();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, answered, nextQuestion, phase]);

  const reset = () => {
    setPhase("setup");
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="practice-board animate-fade">
      {phase === "setup" && (
        <div className="practice-setup">
          <div className="board-title-row">
            <div>
              <span className="eyebrow">Active recall</span>
              <h1>Trung tâm luyện tập</h1>
              <p>Chọn một kỹ năng, trả lời trước khi xem lời giải và tập trung ôn lại phần đã sai.</p>
            </div>
            <button className={`history-toggle ${historyOpen ? "active" : ""}`} onClick={() => setHistoryOpen((value) => !value)}>
              <History size={16} /> Lịch sử <span>{history.length}</span>
            </button>
          </div>

          {historyOpen && (
            <section className="history-drawer animate-fade">
              <div className="history-summary">
                <span><strong>{history.length}</strong> phiên đã làm</span>
                <span><strong>{mistakePool.length}</strong> câu đang cần ôn</span>
                <button disabled={!mistakePool.length} onClick={() => startQuiz(true)}><RotateCcw size={14} /> Ôn câu sai</button>
              </div>
              <div className="history-list">
                {history.length === 0 && <p>Chưa có lịch sử. Phiên đầu tiên sẽ xuất hiện tại đây.</p>}
                {history.slice(0, 6).map((entry) => (
                  <div key={entry.id}>
                    <span className={entry.percent >= 80 ? "good" : entry.percent >= 50 ? "medium" : "low"}>{entry.percent}%</span>
                    <p><strong>{entry.filter}</strong><small>{entry.date} · {Math.max(1, Math.ceil((entry.duration || 0) / 60))} phút</small></p>
                    <em>{entry.score}/{entry.total}</em>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="setup-section">
            <div className="setup-label"><span>01</span><div><strong>Chọn kỹ năng</strong><small>Mỗi loại kiểm tra một cách gợi nhớ khác nhau</small></div></div>
            <div className="practice-type-grid">
              {(Object.keys(TYPE_META) as SetupType[]).map((type) => {
                const meta = TYPE_META[type];
                const Icon = meta.icon;
                const count = type === "all" ? quizQuestions.length : quizQuestions.filter((question) => question.type === type).length;
                return (
                  <button key={type} className={`${setupType === type ? "active" : ""} type-${meta.accent}`} onClick={() => setSetupType(type)}>
                    <span className="type-icon"><Icon size={20} /></span>
                    <span><strong>{meta.label}</strong><small>{meta.description}</small></span>
                    <em>{count}</em>
                    {setupType === type && <CheckCircle2 className="type-check" size={16} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-label"><span>02</span><div><strong>Phạm vi bài học</strong><small>Học rộng hoặc tập trung vào một bài</small></div></div>
            <div className="choice-row lesson-choices">
              <button className={setupLesson === 0 ? "active" : ""} onClick={() => setSetupLesson(0)}>Tất cả bài <small>{pool.length}</small></button>
              {lessons.map((lesson) => (
                <button key={lesson} className={setupLesson === lesson ? "active" : ""} onClick={() => setSetupLesson(lesson)}>
                  Bài {lesson} <small>{quizQuestions.filter((question) => (setupType === "all" || question.type === setupType) && question.lesson === lesson).length}</small>
                </button>
              ))}
              {lessons.length === 0 && <span className="no-lessons">Kỹ năng này được luyện theo bộ tổng hợp.</span>}
            </div>
          </section>

          <section className="setup-section setup-final">
            <div className="setup-label"><span>03</span><div><strong>Độ dài phiên học</strong><small>10–15 câu là khoảng tập trung lý tưởng</small></div></div>
            <div className="choice-row count-choices">
              {[5, 10, 15, 20].filter((count) => count <= pool.length || count === 10).map((count) => (
                <button key={count} className={setupCount === count ? "active" : ""} onClick={() => setSetupCount(count)}>{count} câu</button>
              ))}
              <button className={setupCount === 999 ? "active" : ""} onClick={() => setSetupCount(999)}>Tất cả ({pool.length})</button>
            </div>
            <button className="start-practice" onClick={() => startQuiz(false)} disabled={!pool.length}>
              <Play size={18} fill="currentColor" /> Bắt đầu {Math.min(setupCount, pool.length)} câu
              <ArrowRight size={18} />
            </button>
          </section>
        </div>
      )}

      {phase === "running" && current && (
        <div className="quiz-runner">
          <div className="runner-topbar">
            <button onClick={reset}><ArrowLeft size={15} /> Thoát</button>
            <div><span>{typeLabel(current.type)}</span>{current.lesson ? <span>Bài {current.lesson}</span> : null}</div>
            <span className="runner-timer"><Clock3 size={14} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
          </div>

          <div className="runner-progress-meta"><span>Câu {questionIndex + 1} / {questions.length}</span><span>{score} đúng</span></div>
          <div className="runner-progress"><span style={{ width: `${((questionIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>

          <section className="question-card">
            <span className="question-kicker"><Target size={14} /> Chọn một đáp án</span>
            <h2>{current.question}</h2>
          </section>

          <div className="answer-grid">
            {current.options.map((option, index) => {
              const isCorrect = index === current.answerIndex;
              const isSelected = selected === index;
              const state = answered ? (isCorrect ? "correct" : isSelected ? "wrong" : "muted") : "";
              return (
                <button key={`${option}-${index}`} className={state} disabled={answered} onClick={() => answer(index)}>
                  <span className="answer-key">{index + 1}</span>
                  <strong>{option}</strong>
                  {answered && isCorrect && <CheckCircle2 size={19} />}
                  {answered && isSelected && !isCorrect && <XCircle size={19} />}
                </button>
              );
            })}
          </div>

          {answered && (
            <section className={`answer-feedback ${selected === current.answerIndex ? "correct" : "wrong"}`}>
              <div className="feedback-title">
                {selected === current.answerIndex ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <div><strong>{selected === current.answerIndex ? "Chính xác" : "Chưa đúng"}</strong><span>{selected === current.answerIndex ? "Bạn đã gợi nhớ đúng." : "Đọc lời giải rồi thử tự nhắc lại đáp án."}</span></div>
              </div>
              {hasJapanese(current.options[current.answerIndex]) && (
                <p className="answer-reading">{current.options[current.answerIndex]} <span>· {kanaToRomaji(current.options[current.answerIndex])}</span></p>
              )}
              {current.explanation && <p>{current.explanation}</p>}
            </section>
          )}

          <div className="runner-footer">
            <span>{answered ? "Nhấn Enter để tiếp tục" : "Dùng phím 1–4 để chọn nhanh"}</span>
            <button onClick={nextQuestion} disabled={!answered}>
              {questionIndex + 1 === questions.length ? "Hoàn thành" : "Câu tiếp theo"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="quiz-result animate-fade">
          <section className="result-hero">
            <span className="result-icon"><Award size={34} /></span>
            <span className="eyebrow">Phiên học hoàn tất</span>
            <h1>{percent >= 90 ? "Rất chắc chắn!" : percent >= 70 ? "Tiến bộ tốt!" : "Đã tìm ra phần cần ôn."}</h1>
            <p>{percent >= 80 ? "Bạn có thể chuyển sang một kỹ năng khác hoặc tăng phạm vi bài." : "Sai không phải là thất bại — đây chính là dữ liệu cho lần ôn tiếp theo."}</p>
            <div className="result-score"><strong>{percent}%</strong><span>{score}/{questions.length} câu đúng</span></div>
            <div className="result-stats">
              <span><Clock3 size={14} /><strong>{Math.max(1, Math.ceil(elapsed / 60))}</strong> phút</span>
              <span><CheckCircle2 size={14} /><strong>{score}</strong> đúng</span>
              <span><XCircle size={14} /><strong>{wrongResults.length}</strong> cần ôn</span>
            </div>
          </section>

          {wrongResults.length > 0 && (
            <section className="mistake-review">
              <div className="section-heading compact"><div><span className="eyebrow">Error loop</span><h2>Xem lại câu sai</h2></div><span className="quiet-label">{wrongResults.length} câu</span></div>
              <div className="mistake-list">
                {wrongResults.map((result, index) => (
                  <article key={`${result.q.id}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{result.q.question}</strong><p className="picked">Bạn chọn: {result.q.options[result.selected]}</p><p className="expected">Đúng: {result.q.options[result.q.answerIndex]}</p>{result.q.explanation && <small>{result.q.explanation}</small>}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="result-actions">
            <button className="secondary" onClick={reset}><ArrowLeft size={16} /> Đổi bộ câu hỏi</button>
            <button className="primary" onClick={() => startQuiz(false)}><RefreshCw size={16} /> Làm một phiên khác</button>
          </div>
        </div>
      )}
    </div>
  );
}
