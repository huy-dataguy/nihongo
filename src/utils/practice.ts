import { hiraganaData, katakanaData } from "../data/kanaData";
import { KANJI_N5_REFERENCE } from "../data/kanjiN5Reference";
import { GrammarItem, KanjiItem, QuizQuestion, VocabularyItem } from "../types";

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildOptions(correct: string, pool: string[], seed: number): { options: string[]; answerIndex: number } | null {
  const distractors = unique(pool.filter((value) => value !== correct));
  if (!correct || distractors.length < 3) return null;

  const picked = [0, 1, 2].map((offset) => distractors[(seed * 3 + offset) % distractors.length]);
  const answerIndex = seed % 4;
  const options = [...picked];
  options.splice(answerIndex, 0, correct);
  return { options, answerIndex };
}

export function createPracticeQuestions(
  vocabulary: VocabularyItem[],
  grammar: GrammarItem[],
  kanji: KanjiItem[],
): QuizQuestion[] {
  const generated: QuizQuestion[] = [];

  const vocabMeanings = unique(vocabulary.map((item) => item.meaning));
  const vocabWords = unique(vocabulary.map((item) => item.word));
  vocabulary.forEach((item, index) => {
    const meaningOptions = buildOptions(item.meaning, vocabMeanings, index);
    if (meaningOptions) {
      generated.push({
        id: `auto-vocab-meaning-${item.id}`,
        question: `「${item.word}」(${item.reading}) có nghĩa là gì?`,
        ...meaningOptions,
        explanation: `${item.word} đọc là ${item.reading}, nghĩa là “${item.meaning}”.`,
        type: "vocabulary",
        lesson: item.lesson,
      });
    }

    const wordOptions = buildOptions(item.word, vocabWords, index + 1);
    if (wordOptions) {
      generated.push({
        id: `auto-vocab-word-${item.id}`,
        question: `Chọn từ tiếng Nhật có nghĩa “${item.meaning}”.`,
        ...wordOptions,
        explanation: `Đáp án là ${item.word} (${item.reading}).`,
        type: "vocabulary",
        lesson: item.lesson,
      });
    }
  });

  const grammarMeanings = unique(grammar.map((item) => item.meaning));
  const grammarStructures = unique(grammar.map((item) => item.structure));
  grammar.forEach((item, index) => {
    const meaningOptions = buildOptions(item.meaning, grammarMeanings, index);
    if (meaningOptions) {
      generated.push({
        id: `auto-grammar-meaning-${item.id}`,
        question: `Cấu trúc 「${item.structure}」 được dùng với ý nghĩa nào?`,
        ...meaningOptions,
        explanation: item.explanation || `${item.structure}: ${item.meaning}.`,
        type: "grammar",
        lesson: item.lesson,
      });
    }

    const structureOptions = buildOptions(item.structure, grammarStructures, index + 2);
    if (structureOptions) {
      generated.push({
        id: `auto-grammar-structure-${item.id}`,
        question: `Chọn cấu trúc phù hợp với ý nghĩa “${item.meaning}”.`,
        ...structureOptions,
        explanation: item.explanation || `Cấu trúc đúng là ${item.structure}.`,
        type: "grammar",
        lesson: item.lesson,
      });
    }
  });

  const referenceCharacters = new Set(KANJI_N5_REFERENCE.map((item) => item.character));
  const completeKanji: KanjiItem[] = [
    ...KANJI_N5_REFERENCE.map((item) => ({
      id: `ref-${item.character}`,
      character: item.character,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      meaning: item.meaning,
      lesson: item.lesson,
      examples: [item.example],
    })),
    ...kanji.filter((item) => !referenceCharacters.has(item.character)),
  ];
  const kanjiMeanings = unique(completeKanji.map((item) => item.meaning));
  const kanjiCharacters = unique(completeKanji.map((item) => item.character));
  completeKanji.forEach((item, index) => {
    const meaningOptions = buildOptions(item.meaning, kanjiMeanings, index);
    if (meaningOptions) {
      generated.push({
        id: `auto-kanji-meaning-${item.id}`,
        question: `Kanji 「${item.character}」 mang nghĩa nào?`,
        ...meaningOptions,
        explanation: `${item.character}: ${item.meaning}. Âm On: ${item.onyomi || "—"}; âm Kun: ${item.kunyomi || "—"}.`,
        type: "kanji",
        lesson: item.lesson,
      });
    }

    const characterOptions = buildOptions(item.character, kanjiCharacters, index + 3);
    if (characterOptions) {
      generated.push({
        id: `auto-kanji-character-${item.id}`,
        question: `Chọn Kanji có nghĩa “${item.meaning}”.`,
        ...characterOptions,
        explanation: `Đáp án là ${item.character}.`,
        type: "kanji",
        lesson: item.lesson,
      });
    }
  });

  const kana = [...hiraganaData, ...katakanaData];
  const romajiPool = unique(kana.map((item) => item.romaji));
  const kanaPool = unique(kana.map((item) => item.char));
  kana.forEach((item, index) => {
    const readingOptions = buildOptions(item.romaji, romajiPool, index);
    if (readingOptions) {
      generated.push({
        id: `auto-kana-reading-${item.category}-${item.char}`,
        question: `Chữ 「${item.char}」 được đọc như thế nào?`,
        ...readingOptions,
        explanation: `${item.char} được đọc là “${item.romaji}”.`,
        type: "kana",
        lesson: 0,
      });
    }

    const characterOptions = buildOptions(item.char, kanaPool, index + 1);
    if (characterOptions) {
      generated.push({
        id: `auto-kana-character-${item.category}-${item.char}`,
        question: `Chọn ${item.category === "hiragana" ? "Hiragana" : "Katakana"} cho âm “${item.romaji}”.`,
        ...characterOptions,
        explanation: `Âm “${item.romaji}” được viết là ${item.char}.`,
        type: "kana",
        lesson: 0,
      });
    }
  });

  return generated;
}

export function mergePracticeQuestions(stored: QuizQuestion[], generated: QuizQuestion[]) {
  const byId = new Map<string, QuizQuestion>();
  [...generated, ...stored].forEach((question) => {
    if (question.options.length >= 2 && question.answerIndex >= 0 && question.answerIndex < question.options.length) {
      byId.set(question.id, question);
    }
  });
  return Array.from(byId.values());
}
