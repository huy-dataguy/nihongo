import React, { useState, useMemo } from "react";
import { QuizQuestion } from "../types";
import { CheckCircle2, XCircle, Award, RefreshCw, Layers } from "lucide-react";

interface QuizBoardProps {
  quizQuestions: QuizQuestion[];
  onQuizComplete: (score: number, total: number) => void;
}

export default function QuizBoard({ quizQuestions, onQuizComplete }: QuizBoardProps) {
  const [selectedType, setSelectedType] = useState<"all" | "vocabulary" | "grammar" | "kanji" | "kana">("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (selectedType === "all") return quizQuestions;
    return quizQuestions.filter((q) => q.type === selectedType);
  }, [quizQuestions, selectedType]);

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const question = filteredQuestions[currentQuestionIndex];
    if (optionIndex === question.answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < filteredQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      onQuizComplete(score, filteredQuestions.length);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Ôn luyện trắc nghiệm</h2>
          <p className="text-sm text-gray-500 mt-1">Luyện tập tổng hợp kiến thức từ vựng, ngữ pháp và Kanji N5</p>
        </div>

        {/* Filter Type */}
        <div className="flex flex-wrap gap-2">
          {(["all", "vocabulary", "grammar", "kanji"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setSelectedOption(null);
                setIsAnswered(false);
                setScore(0);
                setCurrentQuestionIndex(0);
                setQuizFinished(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === type
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
            >
              {type === "all" && "🎯 Tất cả"}
              {type === "vocabulary" && "📝 Từ vựng"}
              {type === "grammar" && "📝 Ngữ pháp"}
              {type === "kanji" && "💮 Chữ Hán"}
            </button>
          ))}
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Chưa có câu hỏi trắc nghiệm nào cho chủ đề này.</p>
          <p className="text-xs text-gray-400 mt-1">Hãy nhập văn bản bài học thô ở mục Import bài học để AI tự động đặt câu hỏi ôn tập nhé!</p>
        </div>
      ) : quizFinished ? (
        /* Final Results Display */
        <div className="max-w-md mx-auto text-center py-8 space-y-6 animate-fade">
          <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-500 animate-bounce">
            <Award size={48} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Hoàn thành bài luyện tập!</h3>
            <p className="text-gray-500 text-sm">Cố gắng lắm! Hãy duy trì thói quen ôn tập hằng ngày nhé.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-150 inline-block px-12">
            <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider font-mono">Kết quả đạt được</span>
            <span className="text-5xl font-black text-amber-700 block mt-1">
              {score} / {filteredQuestions.length}
            </span>
            <span className="text-xs text-gray-500 mt-1 block">
              Tỷ lệ chính xác {Math.round((score / filteredQuestions.length) * 100)}%
            </span>
          </div>

          <div>
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 mx-auto text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <RefreshCw size={16} />
              Luyện tập lại
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Running */
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
            <span>CHỦ ĐỀ: <span className="uppercase text-amber-700 font-bold">{currentQuestion.type}</span></span>
            <span>CÂU HỎI {currentQuestionIndex + 1} / {filteredQuestions.length}</span>
          </div>

          {/* Question Title */}
          <div className="bg-stone-50/50 p-5 rounded-2xl border border-gray-100 text-center">
            <p className="text-lg font-bold text-gray-800 leading-relaxed font-sans">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === currentQuestion.answerIndex;
              
              let optionStyle = "border-gray-200 hover:border-amber-300 hover:bg-gray-50/50 bg-white text-gray-800";
              let icon = null;

              if (isAnswered) {
                if (isCorrect) {
                  optionStyle = "border-emerald-300 bg-emerald-50/40 text-emerald-900 font-bold";
                  icon = <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />;
                } else if (isSelected && !isCorrect) {
                  optionStyle = "border-rose-300 bg-rose-50/40 text-rose-900 font-bold";
                  icon = <XCircle size={16} className="text-rose-600 shrink-0" />;
                } else {
                  optionStyle = "border-gray-100 bg-gray-50 opacity-60 text-gray-400";
                }
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                >
                  <span className="flex-1 font-sans ">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explanation Section */}
          {isAnswered && (
            <div className="bg-amber-50/30 rounded-2xl border border-amber-100/70 p-4 space-y-2 animate-fade">
              <span className="text-xs font-bold text-amber-800 block font-mono uppercase tracking-widest">Lời giải chi tiết</span>
              <p className="text-xs text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Controls Footer */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 text-sm font-bold text-white bg-stone-900 hover:bg-stone-850 active:bg-black rounded-xl transition-all shadow-md"
              >
                {currentQuestionIndex + 1 < filteredQuestions.length ? "Câu tiếp theo ▶" : "Xem kết quả 🏁"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
