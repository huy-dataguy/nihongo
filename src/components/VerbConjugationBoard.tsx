import React, { useState, useMemo, useCallback } from "react";
import { speakJapanese } from "../utils/audio";
import { kanaToRomaji } from "../utils/kanaToRomaji";
import {
  Search,
  Volume2,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Shuffle,
  BookOpen,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Table,
} from "lucide-react";

export interface VerbConjugationItem {
  id: string;
  kanji: string;
  hiragana: string;
  romaji: string;
  meaning: string;
  group: 1 | 2 | 3;
  masu: string;
  jisho: string;
  nai: string;
  te: string;
  ta: string;
  kanou?: string; // Potential
  ikou?: string; // Volitional
  jouken?: string; // Conditional
  meirei?: string; // Imperative
  isSpecial?: boolean;
  specialNote?: string;
}

// Master reference dataset for Japanese N5/N4 Verb Conjugations
export const VERB_CONJUGATION_DATABASE: VerbConjugationItem[] = [
  // --- Group 1 (五段 - Godan) ---
  {
    id: "v-kaku",
    kanji: "書く",
    hiragana: "かく",
    romaji: "kaku",
    meaning: "Viết",
    group: 1,
    masu: "書きます",
    jisho: "書く",
    nai: "書かない",
    te: "書いて",
    ta: "書いた",
    kanou: "書ける",
    ikou: "書こう",
    jouken: "書けば",
    meirei: "書け",
  },
  {
    id: "v-nomu",
    kanji: "飲む",
    hiragana: "のむ",
    romaji: "nomu",
    meaning: "Uống",
    group: 1,
    masu: "飲みます",
    jisho: "飲む",
    nai: "飲まない",
    te: "飲んで",
    ta: "飲んだ",
    kanou: "飲める",
    ikou: "飲もう",
    jouken: "飲めば",
    meirei: "飲め",
  },
  {
    id: "v-hanasu",
    kanji: "話す",
    hiragana: "はなす",
    romaji: "hanasu",
    meaning: "Nói chuyện",
    group: 1,
    masu: "話します",
    jisho: "話す",
    nai: "話さない",
    te: "話して",
    ta: "話した",
    kanou: "話せる",
    ikou: "話そう",
    jouken: "話せば",
    meirei: "話せ",
  },
  {
    id: "v-matsu",
    kanji: "待つ",
    hiragana: "まつ",
    romaji: "matsu",
    meaning: "Chờ, đợi",
    group: 1,
    masu: "待ちます",
    jisho: "待つ",
    nai: "待たない",
    te: "待って",
    ta: "待った",
    kanou: "待てる",
    ikou: "待とう",
    jouken: "待てば",
    meirei: "待て",
  },
  {
    id: "v-yobu",
    kanji: "呼ぶ",
    hiragana: "よぶ",
    romaji: "yobu",
    meaning: "Gọi, mời",
    group: 1,
    masu: "呼びます",
    jisho: "呼ぶ",
    nai: "呼ばない",
    te: "呼んで",
    ta: "呼んだ",
    kanou: "呼べる",
    ikou: "呼ぼう",
    jouken: "呼べば",
    meirei: "呼べ",
  },
  {
    id: "v-isogu",
    kanji: "急ぐ",
    hiragana: "いそぐ",
    romaji: "isogu",
    meaning: "Vội vàng, gấp",
    group: 1,
    masu: "急ぎます",
    jisho: "急ぐ",
    nai: "急がない",
    te: "急いで",
    ta: "急いだ",
    kanou: "急げる",
    ikou: "急ごう",
    jouken: "急げば",
    meirei: "急げ",
  },
  {
    id: "v-kau",
    kanji: "買う",
    hiragana: "かう",
    romaji: "kau",
    meaning: "Mua",
    group: 1,
    masu: "買います",
    jisho: "買う",
    nai: "買わない",
    te: "買って",
    ta: "買った",
    kanou: "買える",
    ikou: "買おう",
    jouken: "買えば",
    meirei: "買え",
    isSpecial: true,
    specialNote: "Bẫy Thể Nai: âm う/い chuyển thành わ (買わない), KHÔNG PHẢI 買あない!",
  },
  {
    id: "v-au",
    kanji: "会う",
    hiragana: "あう",
    romaji: "au",
    meaning: "Gặp mặt",
    group: 1,
    masu: "会います",
    jisho: "会う",
    nai: "会わない",
    te: "会って",
    ta: "会った",
    kanou: "会える",
    ikou: "会おう",
    jouken: "会えば",
    meirei: "会え",
    isSpecial: true,
    specialNote: "Bẫy Thể Nai: âm い/う ➔ わ (会わない)",
  },
  {
    id: "v-kaeru",
    kanji: "帰る",
    hiragana: "かえる",
    romaji: "kaeru",
    meaning: "Về nhà",
    group: 1,
    masu: "帰ります",
    jisho: "帰る",
    nai: "帰らない",
    te: "帰って",
    ta: "帰った",
    kanou: "帰れる",
    ikou: "帰ろう",
    jouken: "帰れば",
    meirei: "帰れ",
    isSpecial: true,
    specialNote: "Động từ Nhóm 1 kết thúc bằng え+る (thường dễ nhầm sang Nhóm 2)",
  },
  {
    id: "v-ikiku",
    kanji: "行く",
    hiragana: "いく",
    romaji: "iku",
    meaning: "Đi",
    group: 1,
    masu: "行きます",
    jisho: "行く",
    nai: "行かない",
    te: "行って",
    ta: "行った",
    kanou: "行ける",
    ikou: "行こう",
    jouken: "行けば",
    meirei: "行け",
    isSpecial: true,
    specialNote: "Bẫy Thể Te/Ta: 行く biến thành 行って / 行った (KHÔNG PHẢI 行いて!)",
  },
  {
    id: "v-arimasu",
    kanji: "ある",
    hiragana: "ある",
    romaji: "aru",
    meaning: "Có (vật thể)",
    group: 1,
    masu: "あります",
    jisho: "ある",
    nai: "ない",
    te: "あって",
    ta: "あった",
    kanou: "—",
    ikou: "—",
    jouken: "あれば",
    meirei: "—",
    isSpecial: true,
    specialNote: "Động từ bất quy tắc đặc biệt: Thể Nai của あります là ない (chỉ có 1 chữ ない)!",
  },

  // --- Group 2 (一段 - Ichidan) ---
  {
    id: "v-taberu",
    kanji: "食べる",
    hiragana: "たべる",
    romaji: "taberu",
    meaning: "Ăn",
    group: 2,
    masu: "食べます",
    jisho: "食べる",
    nai: "食べない",
    te: "食べて",
    ta: "食べた",
    kanou: "食べられる",
    ikou: "食べよう",
    jouken: "食べれば",
    meirei: "食べろ",
  },
  {
    id: "v-miru",
    kanji: "見る",
    hiragana: "みる",
    romaji: "miru",
    meaning: "Nhìn, xem",
    group: 2,
    masu: "見ます",
    jisho: "見る",
    nai: "見ない",
    te: "見て",
    ta: "見た",
    kanou: "見られる",
    ikou: "見よう",
    jouken: "見れば",
    meirei: "見ろ",
  },
  {
    id: "v-okiru",
    kanji: "起きる",
    hiragana: "おきる",
    romaji: "okiru",
    meaning: "Thức dậy",
    group: 2,
    masu: "起きます",
    jisho: "起きる",
    nai: "起きない",
    te: "起きて",
    ta: "起きた",
    kanou: "起きられる",
    ikou: "起きよう",
    jouken: "起きれば",
    meirei: "起きろ",
  },
  {
    id: "v-neru",
    kanji: "寝る",
    hiragana: "ねる",
    romaji: "neru",
    meaning: "Ngủ",
    group: 2,
    masu: "寝ます",
    jisho: "寝る",
    nai: "寝ない",
    te: "寝て",
    ta: "寝た",
    kanou: "寝られる",
    ikou: "寝よう",
    jouken: "寝れば",
    meirei: "寝ろ",
  },

  // --- Group 3 (不規則 - Irregular) ---
  {
    id: "v-suru",
    kanji: "する",
    hiragana: "する",
    romaji: "suru",
    meaning: "Làm",
    group: 3,
    masu: "します",
    jisho: "する",
    nai: "しない",
    te: "して",
    ta: "した",
    kanou: "できる",
    ikou: "しよう",
    jouken: "すれば",
    meirei: "しろ",
  },
  {
    id: "v-kuru",
    kanji: "来る",
    hiragana: "くる",
    romaji: "kuru",
    meaning: "Đến",
    group: 3,
    masu: "来ます (きます)",
    jisho: "来る (くる)",
    nai: "来ない (こない)",
    te: "来て (きて)",
    ta: "来た (きた)",
    kanou: "来られる (こられる)",
    ikou: "来よう (こよう)",
    jouken: "来れば (すれば)",
    meirei: "来い (こい)",
    isSpecial: true,
    specialNote: "Đổi âm Kanji: き(ます) ➔ くる (zisho) ➔ こ(ない) ➔ き(て)",
  },
];

export const VerbConjugationBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matrix" | "rules" | "quiz">("matrix");
  const [groupFilter, setGroupFilter] = useState<"all" | 1 | 2 | 3 | "special">("all");
  const [search, setSearch] = useState("");
  const [showFullForms, setShowFullForms] = useState(false);

  // Filtered dataset
  const filteredVerbs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VERB_CONJUGATION_DATABASE.filter((v) => {
      if (groupFilter === 1 && v.group !== 1) return false;
      if (groupFilter === 2 && v.group !== 2) return false;
      if (groupFilter === 3 && v.group !== 3) return false;
      if (groupFilter === "special" && !v.isSpecial) return false;
      if (!q) return true;
      const hay = [
        v.kanji,
        v.hiragana,
        v.romaji,
        v.meaning,
        v.masu,
        v.jisho,
        v.nai,
        v.te,
        v.ta,
        v.specialNote || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [groupFilter, search]);

  // Quiz Mode state
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState<{
    verb: VerbConjugationItem;
    targetFormKey: "nai" | "te" | "ta" | "jisho" | "masu";
    targetFormLabel: string;
    options: string[];
    userAnswer: string | null;
    isCorrect: boolean | null;
  } | null>(null);

  const generateQuiz = useCallback(() => {
    const verb = VERB_CONJUGATION_DATABASE[Math.floor(Math.random() * VERB_CONJUGATION_DATABASE.length)];
    const targetForms: { key: "nai" | "te" | "ta" | "jisho" | "masu"; label: string }[] = [
      { key: "nai", label: "Thể ない (Nai-kei / Phủ định ngắn)" },
      { key: "te", label: "Thể て (Te-kei)" },
      { key: "ta", label: "Thể た (Ta-kei / Quá khứ ngắn)" },
      { key: "jisho", label: "Thể Từ điển (辞書形 / Vる)" },
    ];
    const target = targetForms[Math.floor(Math.random() * targetForms.length)];
    const correctAnswer = verb[target.key];

    // Generate distractor choices
    const choicesSet = new Set<string>([correctAnswer]);
    while (choicesSet.size < 4) {
      const randomVerb = VERB_CONJUGATION_DATABASE[Math.floor(Math.random() * VERB_CONJUGATION_DATABASE.length)];
      const randomKey = targetForms[Math.floor(Math.random() * targetForms.length)].key;
      const candidate = randomVerb[randomKey];
      if (candidate && candidate !== "—") choicesSet.add(candidate);
    }

    const options = Array.from(choicesSet).sort(() => Math.random() - 0.5);

    setCurrentQuiz({
      verb,
      targetFormKey: target.key,
      targetFormLabel: target.label,
      options,
      userAnswer: null,
      isCorrect: null,
    });
  }, []);

  const handleSelectQuizOption = useCallback(
    (option: string) => {
      if (!currentQuiz || currentQuiz.userAnswer !== null) return;
      const correct = option === currentQuiz.verb[currentQuiz.targetFormKey];
      setCurrentQuiz((prev) => (prev ? { ...prev, userAnswer: option, isCorrect: correct } : null));
      setQuizTotal((prev) => prev + 1);
      if (correct) setQuizScore((prev) => prev + 1);
    },
    [currentQuiz]
  );

  return (
    <div className="learning-board bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-amber-700 font-bold">
            <ArrowRightLeft size={14} /> Bảng Quy tắc Chia thể Động từ (JLPT N5 / N4)
          </span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">
            Tổng hợp Quy tắc & Bảng tra thể Động từ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quy tắc chia thể Masu, Thể Từ điển (う), Thể Nai (ない), Thể Te (て), Thể Ta (た) & Ôn luyện phản xạ.
          </p>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "matrix" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Table size={14} /> Bảng tra Động từ
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "rules" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lightbulb size={14} /> Bảng Quy tắc Chia
          </button>
          <button
            onClick={() => {
              setActiveTab("quiz");
              if (!currentQuiz) generateQuiz();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "quiz" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Sparkles size={14} /> Luyện phản xạ
          </button>
        </div>
      </div>

      {/* MODE 1: MATRIX / TABLE VIEW */}
      {activeTab === "matrix" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm từ Kanji, Hiragana, Romaji hoặc nghĩa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-rose-400 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setGroupFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  groupFilter === "all" ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tất cả ({VERB_CONJUGATION_DATABASE.length})
              </button>
              <button
                onClick={() => setGroupFilter(1)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  groupFilter === 1 ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-900 hover:bg-amber-100"
                }`}
              >
                Nhóm 1 (五段)
              </button>
              <button
                onClick={() => setGroupFilter(2)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  groupFilter === 2 ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                }`}
              >
                Nhóm 2 (一段)
              </button>
              <button
                onClick={() => setGroupFilter(3)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  groupFilter === 3 ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-900 hover:bg-purple-100"
                }`}
              >
                Nhóm 3 (不規則)
              </button>
              <button
                onClick={() => setGroupFilter("special")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  groupFilter === "special" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                }`}
              >
                ⚠️ Bẫy hay sai
              </button>
            </div>
          </div>

          {/* Special Trap Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mẹo vàng N5:</span> Âm <strong>い (i)</strong> ở nhóm 1 khi chuyển sang <strong>Thể ない (Nai-kei)</strong> luôn biến thành <strong>わ (wa)</strong> (Ví dụ: 買います ➔ 買わない, 会います ➔ 会わない). Thể Nai của <strong>あります</strong> là <strong>ない</strong>!
            </div>
          </div>

          {/* Main Conjugation Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-mono uppercase font-bold tracking-wider">
                  <th className="px-4 py-3">Động từ (Kanji/Hira)</th>
                  <th className="px-3 py-3">Nghĩa</th>
                  <th className="px-3 py-3">Nhóm</th>
                  <th className="px-3 py-3 text-amber-300">Thể Masu (ます)</th>
                  <th className="px-3 py-3 text-cyan-300">Thể Từ điển (う)</th>
                  <th className="px-3 py-3 text-rose-300">Thể Nai (ない)</th>
                  <th className="px-3 py-3 text-emerald-300">Thể Te (て)</th>
                  <th className="px-3 py-3 text-indigo-300">Thể Ta (た)</th>
                  {showFullForms && (
                    <>
                      <th className="px-3 py-3 text-orange-300">Thể Khả năng</th>
                      <th className="px-3 py-3 text-pink-300">Thể Ý định</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredVerbs.map((v) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      v.isSpecial ? "bg-rose-50/30" : ""
                    }`}
                  >
                    {/* Kanji / Hiragana */}
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakJapanese(v.kanji)}
                          className="hover:text-rose-600 transition-colors"
                          title="Phát âm"
                        >
                          <Volume2 size={13} className="text-slate-400 hover:text-rose-600" />
                        </button>
                        <div>
                          <span className="text-base font-bold font-sans">{v.kanji}</span>
                          <span className="text-[11px] text-slate-500 font-mono ml-2">({v.hiragana})</span>
                          {v.isSpecial && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                              Bẫy
                            </span>
                          )}
                        </div>
                      </div>
                      {v.specialNote && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{v.specialNote}</p>
                      )}
                    </td>

                    {/* Meaning */}
                    <td className="px-3 py-3 text-slate-700 font-medium">{v.meaning}</td>

                    {/* Group Badge */}
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          v.group === 1
                            ? "bg-amber-100 text-amber-900"
                            : v.group === 2
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-purple-100 text-purple-900"
                        }`}
                      >
                        N{v.group}
                      </span>
                    </td>

                    {/* Masu */}
                    <td className="px-3 py-3 font-semibold text-amber-900">{v.masu}</td>

                    {/* Jisho */}
                    <td className="px-3 py-3 font-bold text-cyan-900">{v.jisho}</td>

                    {/* Nai */}
                    <td className="px-3 py-3 font-bold text-rose-600 bg-rose-50/40">{v.nai}</td>

                    {/* Te */}
                    <td className="px-3 py-3 font-semibold text-emerald-800">{v.te}</td>

                    {/* Ta */}
                    <td className="px-3 py-3 font-semibold text-indigo-900">{v.ta}</td>

                    {showFullForms && (
                      <>
                        <td className="px-3 py-3 text-orange-900">{v.kanou || "—"}</td>
                        <td className="px-3 py-3 text-pink-900">{v.ikou || "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 font-mono">
              Hiển thị {filteredVerbs.length} động từ ví dụ chuẩn
            </span>
            <button
              onClick={() => setShowFullForms(!showFullForms)}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              {showFullForms ? "Ẩn thể Khả năng/Ý định (N4)" : "Xem thêm thể Khả năng & Ý định (N4)"}
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: RULES BREAKDOWN VIEW */}
      {activeTab === "rules" && (
        <div className="space-y-8">
          {/* Rule 1: Thể Nai (Nai-kei) */}
          <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-4">
            <div className="flex items-center gap-2 text-rose-900">
              <span className="p-2 rounded-xl bg-rose-600 text-white font-bold text-xs font-mono">01</span>
              <h3 className="text-lg font-bold">Quy tắc chia Thể ない (Nai-kei / Phủ định ngắn) — Bài 17</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-2">
                <span className="font-bold text-amber-800 font-mono uppercase text-[11px]">Nhóm 1 (五段)</span>
                <p className="text-gray-700">Chuyển hàng <strong>い (~i)</strong> ➔ hàng <strong>あ (~a) + ない</strong></p>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-900 font-mono space-y-1">
                  <div>書<strong>き</strong>ます ➔ 書<strong>か</strong>ない (kaka-nai)</div>
                  <div>飲<strong>み</strong>ます ➔ 飲<strong>ま</strong>ない (noma-nai)</div>
                  <div>待<strong>ち</strong>ます ➔ 待<strong>た</strong>ない (mata-nai)</div>
                  <div className="text-rose-700 font-bold border-t border-rose-200 pt-1">
                    ⚠️ 買<strong>い</strong>ます ➔ 買<strong>わ</strong>ない (kawa-nai)
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-2">
                <span className="font-bold text-emerald-800 font-mono uppercase text-[11px]">Nhóm 2 (一段)</span>
                <p className="text-gray-700">Bỏ <strong>ます</strong> ➔ <strong>＋ ない</strong></p>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 font-mono space-y-1">
                  <div>食べます ➔ 食べ<strong>ない</strong> (tabe-nai)</div>
                  <div>見ます ➔ 見<strong>ない</strong> (mi-nai)</div>
                  <div>起きます ➔ 起き<strong>ない</strong> (oki-nai)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-2">
                <span className="font-bold text-purple-800 font-mono uppercase text-[11px]">Nhóm 3 (Bất quy tắc)</span>
                <p className="text-gray-700">Học thuộc lòng biến đổi gốc</p>
                <div className="p-2 bg-purple-50 rounded-lg text-purple-900 font-mono space-y-1">
                  <div>します ➔ <strong>しない</strong> (shi-nai)</div>
                  <div>きます (来ます) ➔ <strong>こない</strong> (ko-nai)</div>
                  <div className="text-rose-700 font-bold border-t border-purple-200 pt-1">
                    ⚠️ あります ➔ <strong>ない</strong> (nai)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rule 2: Thể Te & Ta */}
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900">
              <span className="p-2 rounded-xl bg-emerald-600 text-white font-bold text-xs font-mono">02</span>
              <h3 className="text-lg font-bold">Quy tắc chia Thể て (Te-kei) & Thể た (Ta-kei) — Bài 14 & 19</h3>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs space-y-3">
              <span className="font-bold text-amber-900 uppercase tracking-wider font-mono">
                Nhóm 1 (Quy tắc âm đuôi trước ます)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900">い、ち、り</span> ➔ <strong>った / ってみ</strong>
                  <div className="text-[11px] text-emerald-700 mt-1">買います ➔ 買って</div>
                </div>
                <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900">み、び、に</span> ➔ <strong>んだ / んであ</strong>
                  <div className="text-[11px] text-emerald-700 mt-1">飲みます ➔ 飲んで</div>
                </div>
                <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900">き ➔ いて / ぎ ➔ いで</span>
                  <div className="text-[11px] text-emerald-700 mt-1">書きます ➔ 書い て</div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="font-bold text-rose-900">⚠️ 行きます</span> ➔ <strong>行って / 行った</strong>
                  <div className="text-[11px] text-rose-700 mt-1">(Bẫy đặc biệt!)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: INTERACTIVE QUIZ PRACTICE */}
      {activeTab === "quiz" && currentQuiz && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
              Luyện phản xạ chia thể
            </span>
            <span className="text-xs font-mono font-semibold bg-slate-800 px-3 py-1 rounded-full text-slate-300">
              Điểm: {quizScore} / {quizTotal}
            </span>
          </div>

          {/* Question Box */}
          <div className="text-center py-4 space-y-2">
            <span className="text-xs text-slate-400 uppercase font-mono">{currentQuiz.targetFormLabel}</span>
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-4xl font-extrabold text-white">{currentQuiz.verb.kanji}</h3>
              <button
                onClick={() => speakJapanese(currentQuiz.verb.kanji)}
                className="p-2 rounded-full bg-slate-800 hover:bg-rose-600 transition-colors"
                title="Phát âm"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              ({currentQuiz.verb.hiragana} — {currentQuiz.verb.meaning})
            </p>
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuiz.options.map((option, idx) => {
              const isSelected = currentQuiz.userAnswer === option;
              const isCorrect = option === currentQuiz.verb[currentQuiz.targetFormKey];
              let btnClass = "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700";

              if (currentQuiz.userAnswer !== null) {
                if (isCorrect) {
                  btnClass = "bg-emerald-600 text-white border-emerald-500 font-bold scale-102";
                } else if (isSelected) {
                  btnClass = "bg-rose-600 text-white border-rose-500 font-bold";
                } else {
                  btnClass = "bg-slate-800/40 text-slate-500 border-slate-800 opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectQuizOption(option)}
                  disabled={currentQuiz.userAnswer !== null}
                  className={`p-4 rounded-2xl border text-center transition-all text-sm font-semibold ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {currentQuiz.userAnswer !== null && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold">
                {currentQuiz.isCorrect ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Chính xác! Phản xạ xuất sắc.
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Sai rồi! Đáp án đúng:{" "}
                    <strong>{currentQuiz.verb[currentQuiz.targetFormKey]}</strong>
                  </span>
                )}
              </div>

              <button
                onClick={generateQuiz}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Shuffle size={14} /> Câu tiếp theo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerbConjugationBoard;
