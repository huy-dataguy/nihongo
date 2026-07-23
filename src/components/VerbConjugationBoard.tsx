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
  Layers,
  Check,
  CheckSquare,
  Binary,
  GitBranch,
  ShieldAlert,
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
  tai: string;
  kanou: string;
  ikou: string;
  jouken: string;
  meirei: string;
  ukemi: string;
  shieki: string;
  isSpecial?: boolean;
  specialNote?: string;
}

// Master reference dataset covering ALL 12 core Japanese verb forms
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
    tai: "書きたい",
    kanou: "書ける",
    ikou: "書こう",
    jouken: "書けば",
    meirei: "書け",
    ukemi: "書かれる",
    shieki: "書かせる",
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
    tai: "飲みたい",
    kanou: "飲める",
    ikou: "飲もう",
    jouken: "飲めば",
    meirei: "飲め",
    ukemi: "飲まれる",
    shieki: "飲ませる",
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
    tai: "話したい",
    kanou: "話せる",
    ikou: "話そう",
    jouken: "話せば",
    meirei: "話せ",
    ukemi: "話される",
    shieki: "話させる",
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
    tai: "待ちたい",
    kanou: "待てる",
    ikou: "待とう",
    jouken: "待てば",
    meirei: "待て",
    ukemi: "待たれる",
    shieki: "待たせる",
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
    tai: "呼びたい",
    kanou: "呼べる",
    ikou: "呼ぼう",
    jouken: "呼べば",
    meirei: "呼べ",
    ukemi: "呼ばれる",
    shieki: "呼ばせる",
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
    tai: "急ぎたい",
    kanou: "急げる",
    ikou: "急ごう",
    jouken: "急げば",
    meirei: "急げ",
    ukemi: "急がれる",
    shieki: "急がせる",
  },
  {
    id: "v-shinu",
    kanji: "死ぬ",
    hiragana: "しぬ",
    romaji: "shinu",
    meaning: "Chết",
    group: 1,
    masu: "死にます",
    jisho: "死ぬ",
    nai: "死なない",
    te: "死んで",
    ta: "死んだ",
    tai: "死にたい",
    kanou: "死ねる",
    ikou: "死のう",
    jouken: "死ねば",
    meirei: "死ね",
    ukemi: "死なれる",
    shieki: "死なせる",
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
    tai: "買いたい",
    kanou: "買える",
    ikou: "買おう",
    jouken: "買えば",
    meirei: "買え",
    ukemi: "買われる",
    shieki: "買わせる",
    isSpecial: true,
    specialNote: "Bẫy Thể Nai/Bị động/Sai khiến: い/う ➔ わ (買わない / 買われる / 買わせる)",
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
    tai: "会いたい",
    kanou: "会える",
    ikou: "会おう",
    jouken: "会えば",
    meirei: "会え",
    ukemi: "合われる",
    shieki: "会わせる",
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
    tai: "帰りたい",
    kanou: "帰れる",
    ikou: "帰ろう",
    jouken: "帰れば",
    meirei: "帰れ",
    ukemi: "帰られる",
    shieki: "帰らせる",
    isSpecial: true,
    specialNote: "Nhóm 1 đuôi え+る: Vẫn chia theo Nhóm 1 (帰ります, 帰らない, 帰って)",
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
    tai: "行きたい",
    kanou: "行ける",
    ikou: "行こう",
    jouken: "行けば",
    meirei: "行け",
    ukemi: "行かれる",
    shieki: "行かせる",
    isSpecial: true,
    specialNote: "Bẫy Thể Te/Ta: 行く biến thành 行って / 行った (Bất quy tắc của Nhóm 1!)",
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
    tai: "—",
    kanou: "—",
    ikou: "—",
    jouken: "あれば",
    meirei: "—",
    ukemi: "—",
    shieki: "—",
    isSpecial: true,
    specialNote: "Động từ bất quy tắc đặc biệt: Thể Nai của あります là ない!",
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
    tai: "食べたい",
    kanou: "食べられる",
    ikou: "食べよう",
    jouken: "食べれば",
    meirei: "食べろ",
    ukemi: "食べられる",
    shieki: "食べさせる",
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
    tai: "見たい",
    kanou: "見られる",
    ikou: "見よう",
    jouken: "見れば",
    meirei: "見ろ",
    ukemi: "見られる",
    shieki: "見させる",
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
    tai: "起きたい",
    kanou: "起きられる",
    ikou: "起きよう",
    jouken: "起きれば",
    meirei: "起きろ",
    ukemi: "起きられる",
    shieki: "起きさせる",
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
    tai: "寝たい",
    kanou: "寝られる",
    ikou: "寝よう",
    jouken: "寝れば",
    meirei: "寝ろ",
    ukemi: "寝られる",
    shieki: "寝させる",
  },
  {
    id: "v-kariru",
    kanji: "借りる",
    hiragana: "かりる",
    romaji: "kariru",
    meaning: "Mượn",
    group: 2,
    masu: "借ります",
    jisho: "借りる",
    nai: "借りない",
    te: "借りて",
    ta: "借りた",
    tai: "借りたい",
    kanou: "借りられる",
    ikou: "借りよう",
    jouken: "借りれば",
    meirei: "借りろ",
    ukemi: "借りられる",
    shieki: "借りさせる",
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
    tai: "したい",
    kanou: "できる",
    ikou: "しよう",
    jouken: "すれば",
    meirei: "しろ",
    ukemi: "される",
    shieki: "させる",
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
    tai: "来たい (きたい)",
    kanou: "来られる (こられる)",
    ikou: "来よう (こよう)",
    jouken: "来れば (すれば)",
    meirei: "来い (こい)",
    ukemi: "来られる (こられる)",
    shieki: "来させる (こさせる)",
    isSpecial: true,
    specialNote: "Đổi âm Kanji theo thể: き(ます) ➔ くる ➔ こ(ない) ➔ き(て) ➔ こ(られる)",
  },
];

export const ALL_VERB_FORMS = [
  { key: "masu", label: "Thể Masu (ます)", color: "text-amber-700 bg-amber-50" },
  { key: "jisho", label: "Thể Từ điển (う)", color: "text-cyan-700 bg-cyan-50" },
  { key: "nai", label: "Thể Nai (ない)", color: "text-rose-700 bg-rose-50" },
  { key: "te", label: "Thể Te (て)", color: "text-emerald-700 bg-emerald-50" },
  { key: "ta", label: "Thể Ta (た)", color: "text-indigo-700 bg-indigo-50" },
  { key: "tai", label: "Thể Muốn (たい)", color: "text-purple-700 bg-purple-50" },
  { key: "kanou", label: "Thể Khả năng (える/られる)", color: "text-orange-700 bg-orange-50" },
  { key: "ikou", label: "Thể Ý định (おう/よう)", color: "text-pink-700 bg-pink-50" },
  { key: "jouken", label: "Thể Điều kiện (ば)", color: "text-blue-700 bg-blue-50" },
  { key: "meirei", label: "Thể Mệnh lệnh (え/ろ)", color: "text-red-700 bg-red-50" },
  { key: "ukemi", label: "Thể Bị động (られる)", color: "text-teal-700 bg-teal-50" },
  { key: "shieki", label: "Thể Sai khiến (させる)", color: "text-violet-700 bg-violet-50" },
] as const;

type VerbFormKey = (typeof ALL_VERB_FORMS)[number]["key"];

export function getEndingPattern(v: VerbConjugationItem): string {
  if (v.group === 3) return "Bất quy tắc";
  if (v.group === 2) {
    if (v.hiragana.endsWith("える")) return "~える (~eru)";
    if (v.hiragana.endsWith("いる")) return "~いる (~iru)";
    return "Nhóm 2";
  }
  if (v.id === "v-kaeru") return "~える (Nhóm 1)";
  const lastChar = v.hiragana.slice(-1);
  const rom = kanaToRomaji(lastChar);
  return `~${lastChar} (~${rom})`;
}

export interface GroupAnalysisResult {
  group: 1 | 2 | 3;
  groupLabel: string;
  reason: string;
  isSpecialTrap: boolean;
  matchedVerb?: VerbConjugationItem;
}

export function analyzeVerbGroup(input: string): GroupAnalysisResult | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // 1. Check exact match in database
  const dbMatch = VERB_CONJUGATION_DATABASE.find(
    (v) =>
      v.kanji.toLowerCase() === text ||
      v.hiragana.toLowerCase() === text ||
      v.romaji.toLowerCase() === text ||
      v.masu.toLowerCase() === text ||
      v.jisho.toLowerCase() === text
  );

  if (dbMatch) {
    let reason = "";
    if (dbMatch.group === 3) {
      reason = `Động từ '${dbMatch.kanji}' (${dbMatch.hiragana}) là động từ bất quy tắc thuộc Nhóm 3.`;
    } else if (dbMatch.group === 2) {
      reason = `Động từ '${dbMatch.kanji}' (mang âm đuôi ${getEndingPattern(dbMatch)}) thuộc Nhóm 2 (一段). Bỏ ます/る ➔ + ない / て / た.`;
    } else {
      reason = `Động từ '${dbMatch.kanji}' (${dbMatch.hiragana}) thuộc Nhóm 1 (五段). Chuyển hàng い/う ➔ hàng あ + ない.`;
    }
    if (dbMatch.isSpecial && dbMatch.specialNote) {
      reason += ` [⚠️ Ghi chú bẫy: ${dbMatch.specialNote}]`;
    }
    return {
      group: dbMatch.group,
      groupLabel: dbMatch.group === 1 ? "Nhóm 1 (五段)" : dbMatch.group === 2 ? "Nhóm 2 (一段)" : "Nhóm 3 (不規則)",
      reason,
      isSpecialTrap: !!dbMatch.isSpecial,
      matchedVerb: dbMatch,
    };
  }

  // 2. Dynamic heuristic classification algorithm
  if (text.endsWith("します") || text.endsWith("する") || text === "きます" || text === "くる" || text === "来ます" || text === "来る") {
    return {
      group: 3,
      groupLabel: "Nhóm 3 (不規則 - Bất quy tắc)",
      reason: "Động từ kết thúc bằng します/する hoặc 来ます/くる ➔ 100% Thuộc Nhóm 3 (Bất quy tắc).",
      isSpecialTrap: false,
    };
  }

  const group1Traps = ["帰る", "かえる", "kaeru", "切る", "きる", "kiru", "知る", "しる", "shiru", "入る", "はいり", "hairu", "走る", "はしる", "hashiru"];
  if (group1Traps.some((t) => text.includes(t))) {
    return {
      group: 1,
      groupLabel: "Nhóm 1 (五段 - Bẫy đặc biệt)",
      reason: "Mặc dù có đuôi mang âm ~える / ~いる, đây là 1 trong các động từ bẫy N5 bắt buộc nhớ ➔ Thuộc Nhóm 1 (五段)!",
      isSpecialTrap: true,
    };
  }

  const eRowSounds = ["え", "け", "せ", "て", "ね", "へ", "め", "れ", "げ", "ぜ", "で", "べ", "ぺ"];
  const isERowMasu = eRowSounds.some((e) => text.endsWith(`${e}ます`));
  if (isERowMasu || text.endsWith("える") || text.endsWith("いる")) {
    return {
      group: 2,
      groupLabel: "Nhóm 2 (一段)",
      reason: "Đứng trước ます là âm thuộc hàng え (~e) hoặc đuôi thể từ điển là ~える/~いる ➔ Thuộc Nhóm 2 (一段).",
      isSpecialTrap: false,
    };
  }

  return {
    group: 1,
    groupLabel: "Nhóm 1 (五段)",
    reason: "Đứng trước ます là âm thuộc hàng い (~i) hoặc tận cùng thể từ điển là ~く, ~ぐ, ~す, ~つ, ~ぬ, ~ぶ, ~む, ~う ➔ Thuộc Nhóm 1 (五段).",
    isSpecialTrap: false,
  };
}

export const VerbConjugationBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matrix" | "verifier" | "rules" | "quiz">("matrix");
  const [groupFilter, setGroupFilter] = useState<"all" | 1 | 2 | 3 | "special">("all");
  const [search, setSearch] = useState("");
  const [testInput, setTestInput] = useState("");
  const [visibleForms, setVisibleForms] = useState<Set<VerbFormKey>>(
    new Set(["masu", "jisho", "nai", "te", "ta", "kanou"])
  );

  const testAnalysis = useMemo(() => analyzeVerbGroup(testInput), [testInput]);

  const toggleFormColumn = (key: VerbFormKey) => {
    setVisibleForms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllForms = () => {
    setVisibleForms(new Set(ALL_VERB_FORMS.map((f) => f.key)));
  };

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
        v.kanou,
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
    targetFormKey: VerbFormKey;
    targetFormLabel: string;
    options: string[];
    userAnswer: string | null;
    isCorrect: boolean | null;
  } | null>(null);

  const generateQuiz = useCallback(() => {
    const verb = VERB_CONJUGATION_DATABASE[Math.floor(Math.random() * VERB_CONJUGATION_DATABASE.length)];
    const targetForm = ALL_VERB_FORMS[Math.floor(Math.random() * ALL_VERB_FORMS.length)];
    const correctAnswer = verb[targetForm.key];

    if (!correctAnswer || correctAnswer === "—") {
      generateQuiz();
      return;
    }

    const choicesSet = new Set<string>([correctAnswer]);
    while (choicesSet.size < 4) {
      const randomVerb = VERB_CONJUGATION_DATABASE[Math.floor(Math.random() * VERB_CONJUGATION_DATABASE.length)];
      const candidate = randomVerb[targetForm.key];
      if (candidate && candidate !== "—") choicesSet.add(candidate);
    }

    const options = Array.from(choicesSet).sort(() => Math.random() - 0.5);

    setCurrentQuiz({
      verb,
      targetFormKey: targetForm.key,
      targetFormLabel: targetForm.label,
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
            <ArrowRightLeft size={14} /> Bảng Quy tắc Chia Động từ & Trình Phân Nhóm
          </span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">
            Tổng hợp Quy tắc & Trình Xác Nhận Nhóm Động Từ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tra cứu ma trận 12 thể, thuật toán phân loại Nhóm 1/2/3 và kiểm tra tự động.
          </p>
        </div>

        {/* Top Tab Bar */}
        <div className="flex flex-wrap items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200/60 self-start md:self-auto gap-1">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "matrix" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Table size={14} /> Bảng tra Động từ
          </button>
          <button
            onClick={() => setActiveTab("verifier")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "verifier" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <GitBranch size={14} /> Xác nhận Nhóm 1-2-3
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "rules" ? "bg-white text-rose-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lightbulb size={14} /> 12 Quy tắc Chia
          </button>

          <button
            onClick={() => {
              setActiveTab("quiz");
              if (!currentQuiz) generateQuiz();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
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

          {/* Form Column Selector Filters */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers size={14} className="text-rose-600" /> Chọn các cột thể muốn hiển thị trong bảng:
              </span>
              <button
                onClick={selectAllForms}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 underline"
              >
                Hiện tất cả 12 thể
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_VERB_FORMS.map((form) => {
                const active = visibleForms.has(form.key);
                return (
                  <button
                    key={form.key}
                    onClick={() => toggleFormColumn(form.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                      active
                        ? "bg-slate-900 text-white border-slate-800 shadow-2xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {active && <Check size={12} className="text-rose-400" />}
                    <span>{form.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Conjugation Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-mono uppercase font-bold tracking-wider">
                  <th className="px-4 py-3 sticky left-0 bg-slate-900 z-10">Động từ (Kanji/Hira/Romaji)</th>
                  <th className="px-3 py-3">Nghĩa</th>
                  <th className="px-3 py-3">Nhóm</th>
                  <th className="px-3 py-3 text-rose-300">Nhóm âm đuôi</th>

                  {ALL_VERB_FORMS.map(
                    (f) =>
                      visibleForms.has(f.key) && (
                        <th key={f.key} className={`px-3 py-3 ${f.color.split(" ")[0]}`}>
                          {f.label}
                        </th>
                      )
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
                    {/* Kanji / Hiragana / Romaji */}
                    <td className="px-4 py-3 font-semibold text-slate-900 sticky left-0 bg-white shadow-2xs z-10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakJapanese(v.kanji)}
                          className="hover:text-rose-600 transition-colors"
                          title="Phát âm"
                        >
                          <Volume2 size={13} className="text-slate-400 hover:text-rose-600" />
                        </button>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold font-sans">{v.kanji}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({v.hiragana})</span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-mono block">Romaji: {v.romaji}</span>
                          {v.isSpecial && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                              Bẫy hay sai
                            </span>
                          )}
                        </div>
                      </div>
                      {v.specialNote && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{v.specialNote}</p>
                      )}
                    </td>

                    {/* Meaning */}
                    <td className="px-3 py-3 text-slate-700 font-medium whitespace-nowrap">{v.meaning}</td>

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

                    {/* Ending Pattern Sound */}
                    <td className="px-3 py-3 font-mono font-bold text-rose-700 whitespace-nowrap bg-rose-50/20">
                      {getEndingPattern(v)}
                    </td>

                    {/* Dynamic Selected Form Columns with Romaji */}
                    {ALL_VERB_FORMS.map(
                      (f) =>
                        visibleForms.has(f.key) && (
                          <td key={f.key} className={`px-3 py-3 font-semibold whitespace-nowrap ${f.color}`}>
                            <div className="flex flex-col">
                              <span>{v[f.key] || "—"}</span>
                              {v[f.key] && v[f.key] !== "—" && (
                                <span className="text-[10px] font-mono opacity-65 font-normal">
                                  {kanaToRomaji(v[f.key])}
                                </span>
                              )}
                            </div>
                          </td>
                        )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 2: VERB GROUP VERIFIER & DECISION TREE (Xác Nhận Nhóm 1-2-3) */}
      {activeTab === "verifier" && (
        <div className="space-y-8">
          {/* Automatic Tester Component */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <GitBranch className="h-5 w-5 text-rose-400" />
              <h3 className="text-base font-bold">Trình Kiểm Tra & Phân Loại Nhóm Động Từ Tự Động</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-semibold block">
                Nhập bất kỳ động từ nào (ます形, 辞書形, Romaji hoặc Kanji) để phân loại:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: たべます, かえります, taberu, 行く, 勉強する..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl focus:border-rose-500 focus:outline-none transition-all font-mono"
                />
                {testInput && (
                  <button
                    onClick={() => setTestInput("")}
                    className="px-3 py-2.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Analysis Output Box */}
            {testAnalysis ? (
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Kết quả Phân loại</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      testAnalysis.group === 1
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : testAnalysis.group === 2
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    }`}
                  >
                    {testAnalysis.groupLabel}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {testAnalysis.reason}
                </p>

                {testAnalysis.matchedVerb && (
                  <div className="pt-3 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Masu</span>
                      <span className="font-bold text-amber-400">{testAnalysis.matchedVerb.masu}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Jisho</span>
                      <span className="font-bold text-cyan-400">{testAnalysis.matchedVerb.jisho}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Nai</span>
                      <span className="font-bold text-rose-400">{testAnalysis.matchedVerb.nai}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Te</span>
                      <span className="font-bold text-emerald-400">{testAnalysis.matchedVerb.te}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Hãy nhập động từ ở ô trên (Ví dụ: `かえります` hoặc `taberu`) để xem thuật toán phân loại và lý do!
              </div>
            )}
          </div>

          {/* Step-by-step Flowchart & Rationale */}
          <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200/80 space-y-6">
            <div className="flex items-center gap-2 text-amber-900">
              <Lightbulb className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-bold">Thuật Toán 3 Bước Phân Biệt Nhóm Động Từ (Minna no Nihongo N5)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3 relative">
                <span className="p-2 rounded-xl bg-purple-600 text-white font-bold text-xs font-mono">BƯỚC 1</span>
                <h4 className="font-bold text-purple-900 text-sm">Kiểm tra Nhóm 3 (Bất quy tắc)</h4>
                <p className="text-gray-700 leading-relaxed">
                  Có phải là <strong>します</strong> (hoặc <code>N + します</code> như 勉強します, 散歩します...) hoặc <strong>来ます (きます)</strong> không?
                </p>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 font-mono text-[11px] font-semibold">
                  👉 Có ➔ 100% NHÓM 3!
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3 relative">
                <span className="p-2 rounded-xl bg-emerald-600 text-white font-bold text-xs font-mono">BƯỚC 2</span>
                <h4 className="font-bold text-emerald-900 text-sm">Kiểm tra âm đứng trước ます</h4>
                <div className="space-y-1.5 text-gray-700">
                  <p>• <strong>Hàng え (~e)</strong> (べ, せ, て, れ...): ➔ <strong>100% NHÓM 2</strong> (VD: 食べます, 寝ます, 見せます).</p>
                  <p>• <strong>Hàng い (~i)</strong> đặc biệt bắt buộc nhớ: 見ます, 起きます, 借ります, 降ります, 浴びます, います, できます.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-mono text-[11px] font-semibold">
                  👉 Thuộc các từ trên ➔ NHÓM 2!
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3 relative">
                <span className="p-2 rounded-xl bg-amber-600 text-white font-bold text-xs font-mono">BƯỚC 3</span>
                <h4 className="font-bold text-amber-900 text-sm">Các Động từ còn lại ➔ NHÓM 1</h4>
                <p className="text-gray-700 leading-relaxed">
                  Đứng trước ます là âm <strong>hàng い (~i)</strong> thông thường (買います, 書きます, 飲みます, 待ちます).
                </p>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[11px] font-bold">
                  ⚠️ Bẫy N5: 帰ります (kaerimasu), 切ります (kirimasu) vẫn thuộc NHÓM 1!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: FULL 12 RULES BREAKDOWN VIEW */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Bản đồ 12 Quy tắc Chia thể Tiếng Nhật N5/N4:</span> 
              Động từ tiếng Nhật chia theo quy tắc chuyển đổi cột âm trong bảng 50 âm (あ - い - う - え - お). Dưới đây là đầy đủ quy tắc chia 12 thể chuẩn!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Rule 1: Thể Masu */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 font-mono text-sm">01. Thể Masu (ます形 - Lịch sự)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng い + ます (書く ➔ 書きます)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る + ます (食べる ➔ 食べます, 見る ➔ 見ます)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ します / くる (来る) ➔ きます (来ます)</li>
              </ul>
            </div>

            {/* Rule 2: Thể Từ điển */}
            <div className="p-5 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-2">
              <span className="font-bold text-cyan-900 font-mono text-sm">02. Thể Từ điển (辞書形 - 原形 Vる)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng い ➔ Hàng う (書きます ➔ 書く)</li>
                <li>• <strong>Nhóm 2</strong>: Đuôi ~える/~いる: Bỏ ます + る (食べます ➔ 食べる)</li>
                <li>• <strong>Nhóm 3</strong>: します ➔ する / きます ➔ くる</li>
              </ul>
            </div>

            {/* Rule 3: Thể Nai */}
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <span className="font-bold text-rose-900 font-mono text-sm">03. Thể Nai (ない形 - Phủ định ngắn)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng い ➔ Hàng あ + ない (書きます ➔ 書かない)</li>
                <li className="text-rose-700 font-bold">• ⚠️ Âm い ➔ わ + ない (買います ➔ 買わない)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ ます/る + ない (食べる ➔ 食べない)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ しない / くる ➔ こない / あります ➔ ない</li>
              </ul>
            </div>

            {/* Rule 4: Thể Te */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 font-mono text-sm">04. Thể Te (て形 - Nối câu / Yêu cầu)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: い,ち,り ➔ った / み,び,に ➔ んだ / き ➔ いて / ぎ ➔ いで</li>
                <li className="text-rose-700 font-bold">• ⚠️ 行きます ➔ 行って (Bẫy đặc biệt!)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ ます/る + て (食べて, 見て)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ して / くる ➔ きて</li>
              </ul>
            </div>

            {/* Rule 5: Thể Ta */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
              <span className="font-bold text-indigo-900 font-mono text-sm">05. Thể Ta (た形 - Quá khứ ngắn)</span>
              <p className="text-gray-600 font-medium">⚡ Cách chia HỒNG HỆT thể て (thay て/で ➔ た/だ)</p>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• 買って ➔ 買った / 飲んで ➔ 飲んだ / 食べて ➔ 食べた</li>
              </ul>
            </div>

            {/* Rule 6: Thể Tai */}
            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <span className="font-bold text-purple-900 font-mono text-sm">06. Thể Muốn (たい形 - Muốn làm gì)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1, 2, 3</strong>: Bỏ ます ➔ + たい</li>
                <li>• 例: 書きたい, 飲みたい, 食べたい, したい, きたい</li>
              </ul>
            </div>

            {/* Rule 7: Thể Khả Năng */}
            <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2">
              <span className="font-bold text-orange-900 font-mono text-sm">07. Thể Khả Năng (可能形 - Có thể)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng え + る (書く ➔ 書ける, 飲む ➔ 飲める)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + られる (食べる ➔ 食べられる)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ できる / くる ➔ こられる (来られる)</li>
              </ul>
            </div>

            {/* Rule 8: Thể Ý Định */}
            <div className="p-5 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-2">
              <span className="font-bold text-pink-900 font-mono text-sm">08. Thể Ý Định (意向形 - Rủ rê/Dự định)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng お + う (書く ➔ 書こう, 飲む ➔ 飲もう)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + よう (食べる ➔ 食べよう)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ しよう / くる ➔ こよう (来よう)</li>
              </ul>
            </div>

            {/* Rule 9: Thể Điều Kiện */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 font-mono text-sm">09. Thể Điều Kiện (条件形 - Nếu...ば)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng え + ば (書く ➔ 書けば, 飲む ➔ 飲めば)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + れば (食べる ➔ 食べれば)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ すれば / くる ➔ くれば (来れば)</li>
              </ul>
            </div>

            {/* Rule 10: Thể Mệnh Lệnh */}
            <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200 space-y-2">
              <span className="font-bold text-red-900 font-mono text-sm">10. Thể Mệnh Lệnh (命令形 - Mệnh lệnh)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng え (書く ➔ 書け, 飲む ➔ 飲め)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + ろ (食べる ➔ 食べろ)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ しろ / くる ➔ こい (来い)</li>
              </ul>
            </div>

            {/* Rule 11: Thể Bị Động */}
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <span className="font-bold text-teal-900 font-mono text-sm">11. Thể Bị Động (受身形 - Bị/Được)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng あ + られる (書く ➔ 書かれる, 買う ➔ 買われる)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + られる (食べる ➔ 食べられる)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ される / くる ➔ こられる</li>
              </ul>
            </div>

            {/* Rule 12: Thể Sai Khiến */}
            <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-200 space-y-2">
              <span className="font-bold text-violet-900 font-mono text-sm">12. Thể Sai Khiến (使役形 - Bắt/Cho phép)</span>
              <ul className="space-y-1 text-gray-700 font-mono">
                <li>• <strong>Nhóm 1</strong>: Hàng う ➔ Hàng あ + させる (書く ➔ 書かせる, 買う ➔ 買わせる)</li>
                <li>• <strong>Nhóm 2</strong>: Bỏ る ➔ + させる (食べる ➔ 食べさせる)</li>
                <li>• <strong>Nhóm 3</strong>: する ➔ させる / くる ➔ こさせる</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: INTERACTIVE QUIZ PRACTICE */}
      {activeTab === "quiz" && currentQuiz && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
              Luyện phản xạ 12 thể động từ
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
