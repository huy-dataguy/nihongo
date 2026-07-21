import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KanjiItem, KanjiCompound } from "../types";
import { KANJI_N5_REFERENCE, LESSON_TOPICS } from "../data/kanjiN5Reference";
import { speakJapanese } from "../utils/audio";
import {
  Volume2,
  Search,
  ChevronDown,
  Filter,
  Layers,
  Shuffle,
  List as ListIcon,
  GalleryHorizontalEnd,
  Target,
} from "lucide-react";

interface KanjiBoardProps {
  kanjiList: KanjiItem[];
  onPractice?: () => void;
}

interface DisplayKanji {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  hanViet: string;
  meaning: string;
  lesson: number;
  examples: KanjiCompound[];
}

export default function KanjiBoard({ kanjiList, onPractice }: KanjiBoardProps) {
  const [viewMode, setViewMode] = useState<"list" | "flashcard">("list");
  const [search, setSearch] = useState("");
  const [lessonFilter, setLessonFilter] = useState<number | "">("");
  const [isLessonDropdownOpen, setIsLessonDropdownOpen] = useState(false);

  // Gộp: bộ tham chiếu 164 chữ (Bài 7-24, đủ On/Kun/Hán Việt) + mọi kanji khác
  // từ Supabase (bài ngoài 7-24, hoặc do "Cập nhật hàng ngày (AI)" thêm) không trùng ký tự.
  const mergedList = useMemo<DisplayKanji[]>(() => {
    const refEntries: DisplayKanji[] = KANJI_N5_REFERENCE.map((r) => ({
      id: `ref-${r.character}`,
      character: r.character,
      onyomi: r.onyomi,
      kunyomi: r.kunyomi,
      hanViet: r.hanViet,
      meaning: r.meaning,
      lesson: r.lesson,
      examples: [r.example],
    }));
    const refChars = new Set(refEntries.map((e) => e.character));
    const extra: DisplayKanji[] = kanjiList
      .filter((k) => k.character && !refChars.has(k.character))
      .map((k) => ({
        id: k.id,
        character: k.character,
        onyomi: k.onyomi || "",
        kunyomi: k.kunyomi || "",
        hanViet: "",
        meaning: k.meaning,
        lesson: k.lesson || 0,
        examples: k.examples || [],
      }));
    return [...refEntries, ...extra].sort((a, b) => a.lesson - b.lesson);
  }, [kanjiList]);

  const lessons = useMemo(
    () => Array.from(new Set<number>(mergedList.map((k) => k.lesson))).sort((a: number, b: number) => a - b),
    [mergedList]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mergedList.filter((k) => {
      if (lessonFilter !== "" && k.lesson !== lessonFilter) return false;
      if (!q) return true;
      const hay = [
        k.character,
        k.onyomi,
        k.kunyomi,
        k.hanViet,
        k.meaning,
        ...k.examples.map((e) => `${e.word} ${e.reading} ${e.meaning}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [mergedList, search, lessonFilter]);

  const grouped = useMemo(() => {
    const map = new Map<number, DisplayKanji[]>();
    filtered.forEach((k) => {
      if (!map.has(k.lesson)) map.set(k.lesson, []);
      map.get(k.lesson)!.push(k);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  // --- Flashcard state ---
  const [fcDeck, setFcDeck] = useState<DisplayKanji[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setFcDeck(filtered);
    setFcIndex(0);
    setRevealed(false);
  }, [filtered]);

  const goPrev = useCallback(() => {
    if (!fcDeck.length) return;
    setFcIndex((i) => (i - 1 + fcDeck.length) % fcDeck.length);
    setRevealed(false);
  }, [fcDeck.length]);

  const goNext = useCallback(() => {
    if (!fcDeck.length) return;
    setFcIndex((i) => (i + 1) % fcDeck.length);
    setRevealed(false);
  }, [fcDeck.length]);

  const shuffleDeck = useCallback(() => {
    setFcDeck((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    setFcIndex(0);
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (viewMode !== "flashcard") return;
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === " ") {
        e.preventDefault();
        setRevealed((r) => !r);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewMode, goPrev, goNext]);

  const currentCard = fcDeck[fcIndex];

  return (
    <div className="learning-board bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <span className="eyebrow">Hán tự theo bài</span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">Kanji N5</h2>
          <p className="text-sm text-gray-500 mt-1">
            Âm On, Âm Kun, âm Hán Việt, nghĩa gốc và từ ghép minh họa — {mergedList.length} chữ, Bài{" "}
            {lessons[0] ?? "-"}–{lessons[lessons.length - 1] ?? "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onPractice && <button onClick={onPractice} className="board-practice-button"><Target size={14} /> Kiểm tra Kanji</button>}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm chữ Hán, nghĩa, âm đọc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none transition-all"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLessonDropdownOpen(!isLessonDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100/80 hover:border-amber-300 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-all"
            >
              <Filter size={12} className="text-gray-400" />
              {lessonFilter === "" ? "Tất cả bài" : `Bài ${lessonFilter}`}
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${isLessonDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isLessonDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLessonDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-52 max-h-72 overflow-y-auto rounded-xl bg-white border border-gray-150 shadow-lg py-1.5 z-50 animate-fade">
                  <button
                    onClick={() => { setLessonFilter(""); setIsLessonDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      lessonFilter === "" ? "bg-amber-50/60 text-amber-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tất cả các bài
                  </button>
                  {lessons.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setLessonFilter(n); setIsLessonDropdownOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                        lessonFilter === n ? "bg-amber-50/60 text-amber-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Bài {n} {LESSON_TOPICS[n] ? `— ${LESSON_TOPICS[n]}` : ""}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/10">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white text-amber-800 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ListIcon size={13} /> Danh sách
            </button>
            <button
              onClick={() => setViewMode("flashcard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                viewMode === "flashcard" ? "bg-white text-amber-800 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <GalleryHorizontalEnd size={13} /> Flashcard
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-8">
          {grouped.map(([lesson, items]) => (
            <section key={lesson}>
              <div className="flex items-baseline gap-2.5 mb-3">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                  Bài {lesson}
                </span>
                <span className="text-xs text-gray-500">{LESSON_TOPICS[lesson] || ""}</span>
                <span className="ml-auto text-[10px] text-gray-400 font-mono">{items.length} chữ</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Hán tự</th>
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Âm On</th>
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Âm Kun</th>
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Hán Việt</th>
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Nghĩa</th>
                      <th className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono px-3 py-2">Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((k) => (
                      <tr key={k.id} className="border-t border-gray-100 hover:bg-amber-50/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => speakJapanese(k.character)}
                            title="Phát âm"
                            className="text-3xl font-semibold text-gray-800 font-sans hover:text-amber-700 transition-colors"
                          >
                            {k.character}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-amber-800 whitespace-nowrap">{k.onyomi || "—"}</td>
                        <td className="px-3 py-2.5 text-xs italic font-medium text-emerald-800 whitespace-nowrap">{k.kunyomi || "—"}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-rose-700 whitespace-nowrap">{k.hanViet || "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{k.meaning}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {k.examples.map((ex, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-700">{ex.word}</span>
                              <span className="text-gray-400">({ex.reading})</span>
                              <span>— {ex.meaning}</span>
                              <button
                                onClick={() => speakJapanese(ex.word)}
                                className="text-gray-300 hover:text-amber-700 transition-colors"
                                title="Phát âm từ ghép"
                              >
                                <Volume2 size={11} />
                              </button>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {grouped.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Layers className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm font-medium">Không tìm thấy chữ Hán nào trùng khớp.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          {currentCard ? (
            <>
              <div className="flex items-baseline gap-2.5 mb-4">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                  Bài {currentCard.lesson}
                </span>
                <span className="text-xs text-gray-500">{LESSON_TOPICS[currentCard.lesson] || ""}</span>
                <span className="ml-auto text-[11px] text-gray-400 font-mono">
                  {fcIndex + 1} / {fcDeck.length}
                </span>
              </div>

              <div
                onClick={() => setRevealed((r) => !r)}
                className="bg-gray-50/50 border border-gray-150 rounded-2xl min-h-[320px] flex flex-col items-center justify-center gap-5 p-10 cursor-pointer select-none relative"
              >
                <div className="flex items-center gap-3">
                  <span className="text-7xl font-semibold text-gray-900 font-sans">{currentCard.character}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakJapanese(currentCard.character); }}
                    className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-full transition-colors"
                    title="Phát âm"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>

                <div
                  className={`flex flex-col items-center gap-2 text-center transition-all duration-200 ${
                    revealed ? "opacity-100 blur-none" : "opacity-40 blur-sm"
                  }`}
                >
                  <div className="flex items-center gap-4 text-sm">
                    <span><span className="text-gray-400 font-mono text-[10px] mr-1">ON</span><span className="font-semibold text-amber-800">{currentCard.onyomi || "—"}</span></span>
                    <span><span className="text-gray-400 font-mono text-[10px] mr-1">KUN</span><span className="italic font-medium text-emerald-800">{currentCard.kunyomi || "—"}</span></span>
                    <span><span className="text-gray-400 font-mono text-[10px] mr-1">HV</span><span className="font-bold text-rose-700">{currentCard.hanViet || "—"}</span></span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{currentCard.meaning}</p>
                  {currentCard.examples[0] && (
                    <p className="text-xs text-gray-500">
                      {currentCard.examples[0].word} ({currentCard.examples[0].reading}) — {currentCard.examples[0].meaning}
                    </p>
                  )}
                </div>

                {!revealed && (
                  <span className="absolute bottom-4 text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                    Bấm để xem cách đọc
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={goPrev} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                  ← Trước
                </button>
                <button onClick={shuffleDeck} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                  <Shuffle size={13} /> Xáo trộn
                </button>
                <button onClick={goNext} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                  Sau →
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-3 font-mono">
                Phím ← → để chuyển thẻ · Cách (Space) để lật thẻ
              </p>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Layers className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm font-medium">Không có chữ Hán nào khớp bộ lọc.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
