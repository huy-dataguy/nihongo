import assert from "node:assert/strict";
import test from "node:test";
import { GrammarItem, QuizQuestion, VocabularyItem } from "../types";
import { createPracticeQuestions, mergePracticeQuestions } from "./practice";

const vocabulary: VocabularyItem[] = [
  ["v1", "猫", "ねこ", "mèo"],
  ["v2", "犬", "いぬ", "chó"],
  ["v3", "鳥", "とり", "chim"],
  ["v4", "魚", "さかな", "cá"],
].map(([id, word, reading, meaning]) => ({ id, word, reading, meaning, romaji: "", category: "test", examples: [] }));

const grammar: GrammarItem[] = [
  ["g1", "〜てください", "hãy làm", "Dùng để yêu cầu lịch sự."],
  ["g2", "〜てもいい", "được phép", "Dùng để xin hoặc cho phép."],
  ["g3", "〜てはいけない", "không được", "Dùng để cấm đoán."],
  ["g4", "〜たい", "muốn làm", "Dùng để diễn đạt mong muốn."],
].map(([id, structure, meaning, explanation]) => ({ id, structure, meaning, explanation, examples: [] }));

test("generates valid recall questions for every learning area", () => {
  const questions = createPracticeQuestions(vocabulary, grammar, []);
  const types = new Set(questions.map((question) => question.type));

  assert.deepEqual(types, new Set(["vocabulary", "grammar", "kanji", "kana"]));
  questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.ok(question.answerIndex >= 0 && question.answerIndex < question.options.length);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.explanation.length > 0);
  });
});

test("keeps curated questions when ids overlap generated content", () => {
  const generated = createPracticeQuestions(vocabulary, grammar, []);
  const curated: QuizQuestion = {
    ...generated[0],
    question: "Câu hỏi đã được biên soạn",
  };

  const merged = mergePracticeQuestions([curated], generated);
  assert.equal(merged.find((question) => question.id === curated.id)?.question, curated.question);
  assert.equal(merged.filter((question) => question.id === curated.id).length, 1);
});
