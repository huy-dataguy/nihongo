/**
 * Type declarations for Personal Japanese Learning Assistant (N5)
 */

export interface KanaCharacter {
  char: string;
  romaji: string;
  type: "gojuon" | "dakuon" | "handakuon" | "yoon";
  category: "hiragana" | "katakana";
}

export interface ExampleSentence {
  japanese: string;
  reading: string;
  meaning: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
  category: string;
  lesson?: number;
  examples: ExampleSentence[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface GrammarExample {
  // Statement format
  tieng_nhat?: string;
  tieng_viet?: string;
  // Q&A format
  cau_hoi?: string;
  dich_cau_hoi?: string;
  cau_tra_loi?: string;
  dich_cau_tra_loi?: string;
  // Additional
  tra_loi_khang_dinh?: string;
  dich_khang_dinh?: string;
  tra_loi_phu_dinh?: string;
  dich_phu_dinh?: string;
  // Legacy format
  japanese?: string;
  reading?: string;
  meaning?: string;
}

export interface GrammarItem {
  id: string;
  structure: string;
  meaning: string;
  explanation: string;
  notes?: string;
  category?: string;
  lesson?: number;
  examples: GrammarExample[];
  summary?: Record<string, any>;
  conjugationTables?: Record<string, any>;
  isCustom?: boolean;
}

export interface KanjiCompound {
  word: string;
  reading: string;
  meaning: string;
}

export interface KanjiItem {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  lesson?: number;
  examples: KanjiCompound[];
  isCustom?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  type: "vocabulary" | "grammar" | "kanji" | "kana";
  lesson?: number;
  isCustom?: boolean;
}

export interface StudyProgress {
  viewedKana: string[];
  quizScores: {
    [quizId: string]: {
      score: number;
      total: number;
      date: string;
    }
  };
  favorites: string[];
}

export interface DailyImportLog {
  id: string;
  date: string;
  rawText: string;
  parsedItemCount: {
    vocabulary: number;
    grammar: number;
    kanji: number;
    quizzes: number;
  };
}
