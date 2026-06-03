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
  id: string; // generated client-side
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
  category: string; // week or theme (e.g. "Tuần 1 - Chào hỏi", "Gia đình")
  examples: ExampleSentence[];
  isCustom?: boolean; // user imported
  createdAt?: string;
}

export interface GrammarItem {
  id: string;
  structure: string;
  meaning: string;
  explanation: string;
  examples: ExampleSentence[];
  category?: string; // week or level
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
  meaning: string; // Hán-Việt & Viet meaning
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
  isCustom?: boolean;
}

export interface StudyProgress {
  viewedKana: string[]; // list of romaji/chars mastered
  quizScores: {
    [quizId: string]: {
      score: number;
      total: number;
      date: string;
    }
  };
  favorites: string[]; // vocabulary or grammar IDs starred
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
