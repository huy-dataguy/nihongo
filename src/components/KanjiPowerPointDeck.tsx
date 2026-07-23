import React, { useState, useEffect, useCallback, useRef } from "react";
import KanjiStrokeViewer from "./KanjiStrokeViewer";
import { speakJapanese } from "../utils/audio";
import { kanaToRomaji } from "../utils/kanaToRomaji";
import { LESSON_TOPICS } from "../data/kanjiN5Reference";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Palette,
  LayoutGrid,
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen,
} from "lucide-react";

export interface DeckKanjiItem {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  hanViet: string;
  meaning: string;
  lesson: number;
  examples: Array<{
    word: string;
    reading: string;
    meaning: string;
  }>;
}

interface KanjiPowerPointDeckProps {
  kanjiList: DeckKanjiItem[];
  initialIndex?: number;
  onClose: () => void;
}

type PPTTheme = "dark" | "washi" | "white" | "cyber";

export const KanjiPowerPointDeck: React.FC<KanjiPowerPointDeckProps> = ({
  kanjiList,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [theme, setTheme] = useState<PPTTheme>("dark");
  const [autoPlaySlides, setAutoPlaySlides] = useState<boolean>(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number>(6); // seconds per slide
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<number>(0);
  const [totalStrokes, setTotalStrokes] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = kanjiList[currentIndex] || kanjiList[0];

  // Navigation handlers
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % kanjiList.length);
  }, [kanjiList.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + kanjiList.length) % kanjiList.length);
  }, [kanjiList.length]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard shortcut listener for PowerPoint slide deck controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (!document.fullscreenElement) {
          onClose();
        }
      } else if (e.key === "a" || e.key === "A") {
        if (currentItem?.character) speakJapanese(currentItem.character);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, toggleFullscreen, onClose, currentItem]);

  // Auto-play slides timer
  useEffect(() => {
    if (!autoPlaySlides) return;
    slideTimerRef.current = setTimeout(() => {
      goNext();
    }, autoPlaySpeed * 1000);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [autoPlaySlides, currentIndex, autoPlaySpeed, goNext]);

  // Theme styling mapping
  const themeStyles = {
    dark: {
      bg: "bg-slate-950 text-slate-100",
      headerBg: "bg-slate-900/90 border-slate-800",
      cardBg: "bg-slate-900/80 border-slate-800 shadow-2xl",
      accentText: "text-amber-400",
      accentBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      hanVietBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      strokeActiveColor: "#fbbf24", // Gold
      strokeCompletedColor: "#e2e8f0",
      gridColor: "#334155",
      btnBg: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    },
    washi: {
      bg: "bg-[#faf6ed] text-stone-900", // Traditional cream paper
      headerBg: "bg-[#f3ebe0]/90 border-amber-900/10",
      cardBg: "bg-[#ffffff]/90 border-stone-200 shadow-xl",
      accentText: "text-amber-800",
      accentBadge: "bg-amber-100 text-amber-900 border-amber-200",
      hanVietBadge: "bg-rose-100 text-rose-900 border-rose-200",
      strokeActiveColor: "#c2410c", // Crimson red ink
      strokeCompletedColor: "#1c1917", // Sumi black
      gridColor: "#d6d3d1",
      btnBg: "bg-stone-200/80 hover:bg-stone-300 text-stone-800",
    },
    white: {
      bg: "bg-slate-50 text-slate-900",
      headerBg: "bg-white/90 border-slate-200",
      cardBg: "bg-white border-slate-200 shadow-xl",
      accentText: "text-indigo-600",
      accentBadge: "bg-indigo-50 text-indigo-700 border-indigo-100",
      hanVietBadge: "bg-rose-50 text-rose-700 border-rose-100",
      strokeActiveColor: "#4f46e5", // Indigo
      strokeCompletedColor: "#0f172a",
      gridColor: "#cbd5e1",
      btnBg: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    },
    cyber: {
      bg: "bg-gray-950 text-cyan-50",
      headerBg: "bg-gray-900/90 border-cyan-900/40",
      cardBg: "bg-gray-900/90 border-cyan-500/30 shadow-2xl shadow-cyan-950/50",
      accentText: "text-cyan-400",
      accentBadge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      hanVietBadge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
      strokeActiveColor: "#06b6d4", // Cyan glow
      strokeCompletedColor: "#f8fafc",
      gridColor: "#1e293b",
      btnBg: "bg-gray-800 hover:bg-cyan-950 text-cyan-200 border border-cyan-900/50",
    },
  }[theme];

  if (!currentItem) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col font-sans overflow-hidden transition-colors duration-300 ${themeStyles.bg}`}
    >
      {/* 1. PPT Top Control Toolbar */}
      <header className={`px-6 py-3 border-b flex items-center justify-between backdrop-blur-md ${themeStyles.headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500">
              <Layers size={18} />
            </span>
            <h1 className="text-base font-bold tracking-tight">Trình chiếu Kanji (PPT Mode)</h1>
          </div>
          <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold ${themeStyles.accentBadge}`}>
            Slide {currentIndex + 1} / {kanjiList.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Bài {currentItem.lesson} {LESSON_TOPICS[currentItem.lesson] ? `— ${LESSON_TOPICS[currentItem.lesson]}` : ""}
          </span>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* Slide Deck Thumbnail Drawer Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Danh sách slide"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${themeStyles.btnBg}`}
          >
            <LayoutGrid size={15} />
            <span className="hidden md:inline">Danh sách Slide</span>
          </button>

          {/* PPT Theme Selector */}
          <div className="relative flex items-center bg-black/10 rounded-lg p-1 border border-white/10">
            {(["dark", "washi", "white", "cyber"] as PPTTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md uppercase tracking-wider transition-all ${
                  theme === t ? "bg-rose-600 text-white shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                title={`Giao diện ${t}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}
            className={`p-2 rounded-lg transition-colors ${themeStyles.btnBg}`}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close Slide Deck */}
          <button
            onClick={onClose}
            title="Đóng trình chiếu (Esc)"
            className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Slide Canvas Area */}
      <div className="flex-1 relative flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-8 overflow-y-auto">
        {/* Left Side: Animated Stroke Order Interactive Viewer */}
        <div className="flex flex-col items-center justify-center w-full lg:w-1/2 max-w-xl">
          <div className={`w-full rounded-3xl border p-6 flex flex-col items-center relative backdrop-blur-md ${themeStyles.cardBg}`}>
            {/* Top Slide Header inside Card */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{currentItem.character}</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${themeStyles.hanVietBadge}`}>
                  {currentItem.hanViet || "Hán tự"}
                </span>
              </div>
              <button
                onClick={() => speakJapanese(currentItem.character)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm"
                title="Phát âm chữ Hán (Phím A)"
              >
                <Volume2 size={15} />
                <span>Phát âm</span>
              </button>
            </div>

            {/* Kanji VG Stroke Animation Component */}
            <KanjiStrokeViewer
              key={currentItem.character}
              character={currentItem.character}
              size={260}
              speed={0.7}
              autoPlay={true}
              showNumbers={true}
              activeColor={themeStyles.strokeActiveColor}
              completedColor={themeStyles.strokeCompletedColor}
              gridColor={themeStyles.gridColor}
              showStepBreakdown={true}
              onStrokeChange={(curr, tot) => {
                setCurrentStroke(curr);
                setTotalStrokes(tot);
              }}
            />
          </div>
        </div>

        {/* Right Side: Detailed Kanji Slide Information */}
        <div className="w-full lg:w-1/2 max-w-xl flex flex-col gap-5">
          <div className={`w-full rounded-3xl border p-6 lg:p-8 flex flex-col gap-6 backdrop-blur-md ${themeStyles.cardBg}`}>
            {/* Main Meaning Header */}
            <div>
              <span className="text-xs uppercase font-mono tracking-widest opacity-60">Nghĩa tiếng Việt</span>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1">{currentItem.meaning}</h2>
            </div>

            {/* Pronunciations: Onyomi & Kunyomi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Onyomi Card */}
              <div className="p-4 rounded-2xl bg-black/10 border border-white/10 flex flex-col gap-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  Âm On (Âm Hán-Nhật)
                </span>
                <span className="text-xl font-bold">{currentItem.onyomi || "—"}</span>
                {currentItem.onyomi && (
                  <span className="text-xs font-mono opacity-60">Romaji: {kanaToRomaji(currentItem.onyomi)}</span>
                )}
              </div>

              {/* Kunyomi Card */}
              <div className="p-4 rounded-2xl bg-black/10 border border-white/10 flex flex-col gap-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-500">
                  Âm Kun (Âm Thuần Nhật)
                </span>
                <span className="text-xl font-bold italic">{currentItem.kunyomi || "—"}</span>
                {currentItem.kunyomi && (
                  <span className="text-xs font-mono opacity-60">Romaji: {kanaToRomaji(currentItem.kunyomi)}</span>
                )}
              </div>
            </div>

            {/* Example Compound Words */}
            {currentItem.examples && currentItem.examples.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase font-mono tracking-widest opacity-60 flex items-center gap-1.5">
                  <BookOpen size={14} /> Từ ghép minh họa ({currentItem.examples.length})
                </span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {currentItem.examples.map((ex, i) => {
                    const rom = kanaToRomaji(ex.reading);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-black/10 border border-white/10 flex items-center justify-between gap-3 group hover:border-rose-500/40 transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-rose-400">{ex.word}</span>
                            <span className="text-xs font-medium opacity-80">
                              ({ex.reading} {rom ? `• ${rom}` : ""})
                            </span>
                          </div>
                          <span className="text-xs opacity-90 mt-0.5">{ex.meaning}</span>
                        </div>
                        <button
                          onClick={() => speakJapanese(ex.word)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 hover:text-white opacity-80 group-hover:opacity-100 transition-colors"
                          title="Phát âm từ ghép"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Slide Thumbnails Sidebar Drawer (if open) */}
      {showThumbnails && (
        <div className="absolute inset-y-0 right-0 z-50 w-80 bg-slate-900/95 border-l border-slate-800 backdrop-blur-lg p-4 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutGrid size={16} /> Danh sách Slide ({kanjiList.length})
            </span>
            <button onClick={() => setShowThumbnails(false)} className="p-1 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {kanjiList.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id || idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowThumbnails(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isActive
                      ? "bg-rose-600 text-white border-rose-500 shadow-md font-semibold"
                      : "bg-slate-800/60 text-slate-200 border-slate-700/50 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{item.character}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold truncate max-w-[120px]">{item.meaning}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {item.hanViet || `Bài ${item.lesson}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono opacity-60">#{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PPT Bottom Control Bar & Progress */}
      <footer className={`px-6 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md ${themeStyles.headerBg}`}>
        {/* Slide Progress Indicator Bar */}
        <div className="w-full sm:w-1/3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / kanjiList.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold opacity-70 whitespace-nowrap">
            {currentIndex + 1} / {kanjiList.length}
          </span>
        </div>

        {/* Center Primary Presentation Stepper Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${themeStyles.btnBg}`}
          >
            <ChevronLeft size={16} /> Slide trước
          </button>

          {/* Auto Play Slideshow Button */}
          <button
            onClick={() => setAutoPlaySlides(!autoPlaySlides)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              autoPlaySlides ? "bg-rose-600 text-white shadow-md animate-pulse" : themeStyles.btnBg
            }`}
            title="Tự động chuyển slide"
          >
            {autoPlaySlides ? <Pause size={15} /> : <Play size={15} />}
            <span>{autoPlaySlides ? "Đang chiếu slide" : "Tự động chiếu"}</span>
          </button>

          <button
            onClick={goNext}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${themeStyles.btnBg}`}
          >
            Slide sau <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Info Note */}
        <div className="text-[11px] font-mono opacity-50 hidden md:block">
          Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/20">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/20">→</kbd> để chuyển slide · <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/20">F</kbd> toàn màn hình
        </div>
      </footer>
    </div>
  );
};

export default KanjiPowerPointDeck;
